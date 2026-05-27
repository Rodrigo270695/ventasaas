<?php

namespace App\Services\Sales;

use App\Models\DocumentSeries;
use App\Models\ProductVariant;
use App\Models\SalesDocument;
use App\Models\SalesDocumentLine;
use App\Models\Warehouse;
use App\Services\Documents\DocumentSeriesService;
use App\Services\ElectronicBilling\ElectronicDocumentService;
use App\Services\Inventory\StockMovementService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SalesDocumentService
{
    public function __construct(
        private readonly DocumentSeriesService $seriesService,
        private readonly StockMovementService $stockMovementService,
        private readonly ElectronicDocumentService $electronicDocuments,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function saveDraft(array $payload, ?SalesDocument $existing = null, ?int $userId = null): SalesDocument
    {
        if ($existing && ! $existing->isDraft()) {
            throw new InvalidArgumentException('Solo se pueden editar comprobantes en borrador.');
        }

        return DB::transaction(function () use ($payload, $existing, $userId) {
            $series = DocumentSeries::query()->findOrFail($payload['document_series_id']);

            if (! $series->is_active) {
                throw new InvalidArgumentException('La serie seleccionada no está activa.');
            }

            $isInternal = $series->isInternal();

            if ($existing && $existing->isInternal() !== $isInternal) {
                throw new InvalidArgumentException('No puedes cambiar el tipo de documento (fiscal / interno).');
            }

            $customerPartyId = $payload['customer_party_id'] ?? null;
            if ($customerPartyId === '') {
                $customerPartyId = null;
            }

            if (! $isInternal && ! $customerPartyId) {
                throw new InvalidArgumentException('Selecciona un cliente para comprobantes fiscales.');
            }

            $attributes = [
                'document_series_id' => $series->id,
                'sunat_document_type_code' => $series->sunat_document_type_code,
                'series' => $series->series,
                'is_internal' => $isInternal,
                'customer_party_id' => $customerPartyId,
                'warehouse_id' => $payload['warehouse_id'] ?? null,
                'issue_date' => $payload['issue_date'],
                'due_date' => $payload['due_date'] ?? null,
                'currency_code' => $payload['currency_code'] ?? 'PEN',
                'exchange_rate' => $payload['exchange_rate'] ?? '1',
                'global_discount' => $this->money($payload['global_discount'] ?? '0'),
                'notes' => $payload['notes'] ?? null,
                'status' => SalesDocument::STATUS_DRAFT,
                'source' => SalesDocument::SOURCE_ERP,
            ];

            if ($existing) {
                $existing->update($attributes);
                $document = $existing;
            } else {
                $document = SalesDocument::query()->create([
                    ...$attributes,
                    'payment_status' => SalesDocument::PAYMENT_UNPAID,
                    'created_by' => $userId,
                ]);
            }

            $this->syncLines($document, $payload['lines'] ?? []);

            return $document->fresh(['lines.variant.product', 'customer', 'documentSeries']);
        });
    }

    public function confirm(SalesDocument $document, ?int $userId = null): SalesDocument
    {
        if (! $document->isDraft()) {
            throw new InvalidArgumentException('El comprobante ya fue confirmado o anulado.');
        }

        $document->load(['lines.variant.product', 'documentSeries', 'warehouse']);

        if ($document->lines->isEmpty()) {
            throw new InvalidArgumentException('Agrega al menos una línea al comprobante.');
        }

        $needsStock = $document->lines->contains(
            fn (SalesDocumentLine $line) => $line->variant?->product?->track_stock,
        );

        if ($needsStock && ! $document->warehouse_id) {
            throw new InvalidArgumentException('Selecciona un almacén para descontar stock.');
        }

        return DB::transaction(function () use ($document, $userId) {
            $series = $document->documentSeries ?? DocumentSeries::query()->findOrFail($document->document_series_id);
            $number = $this->seriesService->reserveNext($series);
            $fullNumber = sprintf('%s-%s', $document->series, str_pad((string) $number, 8, '0', STR_PAD_LEFT));

            $document->update([
                'number' => $number,
                'full_number' => $fullNumber,
                'status' => SalesDocument::STATUS_CONFIRMED,
            ]);

            if ($document->warehouse_id) {
                $warehouse = Warehouse::query()->findOrFail($document->warehouse_id);
                $this->stockMovementService->postSaleOut(
                    $warehouse,
                    $document->fresh(),
                    $document->lines()->get(),
                    $userId,
                );
            }

            $confirmed = $document->fresh(['lines.variant.product', 'customer', 'documentSeries', 'warehouse']);

            if ($confirmed->isFiscal()) {
                $this->electronicDocuments->queueForSalesDocument($confirmed);
            }

            return $confirmed->load('electronicDocument');
        });
    }

    /**
     * Recalcula totales de líneas y cabecera según cantidades/precios guardados.
     * Útil para corregir comprobantes afectados por IGV en % mal interpretado.
     *
     * @return array{
     *     changed: bool,
     *     subtotal: string,
     *     tax_amount: string,
     *     total: string
     * }
     */
    public function recalculateTotals(SalesDocument $document, bool $persist = true): array
    {
        if ($document->status === SalesDocument::STATUS_VOIDED) {
            throw new InvalidArgumentException('No se pueden recalcular comprobantes anulados.');
        }

        $document->loadMissing(['lines.variant.product', 'lines.variant.taxProfile']);

        $subtotal = '0';
        $taxAmount = '0';
        $total = '0';
        $changed = false;

        foreach ($document->lines as $line) {
            $variant = $line->variant;

            if (! $variant) {
                throw new InvalidArgumentException(
                    "La línea {$line->id} no tiene variante de producto asociada.",
                );
            }

            $calculated = $this->calculateLine([
                'quantity' => (string) $line->quantity,
                'unit_price' => (string) $line->unit_price,
                'discount' => (string) $line->discount,
                'description' => $line->description,
            ], $variant);

            if ($this->lineTotalsDiffer($line, $calculated)) {
                $changed = true;

                if ($persist) {
                    $line->update([
                        'tax_affectation_code' => $calculated['tax_affectation_code'],
                        'igv_rate' => $calculated['igv_rate'],
                        'line_subtotal' => $calculated['line_subtotal'],
                        'igv_amount' => $calculated['igv_amount'],
                        'line_total' => $calculated['line_total'],
                    ]);
                }
            }

            $subtotal = bcadd($subtotal, $calculated['line_subtotal'], 4);
            $taxAmount = bcadd($taxAmount, $calculated['igv_amount'], 4);
            $total = bcadd($total, $calculated['line_total'], 4);
        }

        $globalDiscount = $this->money((string) $document->global_discount);

        if (bccomp($globalDiscount, '0', 4) === 1) {
            $total = bcsub($total, $globalDiscount, 4);

            if (bccomp($total, '0', 4) === -1) {
                $total = '0.0000';
            }
        }

        $headerChanged = bccomp((string) $document->subtotal, $subtotal, 4) !== 0
            || bccomp((string) $document->tax_amount, $taxAmount, 4) !== 0
            || bccomp((string) $document->total, $total, 4) !== 0;

        if ($headerChanged) {
            $changed = true;

            if ($persist) {
                $document->update([
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'total' => $total,
                ]);
            }
        }

        return [
            'changed' => $changed,
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $total,
        ];
    }

    /**
     * @param  array{
     *     line_subtotal: string,
     *     igv_amount: string,
     *     line_total: string,
     *     igv_rate: string,
     *     tax_affectation_code: string
     * }  $calculated
     */
    private function lineTotalsDiffer(SalesDocumentLine $line, array $calculated): bool
    {
        return bccomp((string) $line->line_subtotal, $calculated['line_subtotal'], 4) !== 0
            || bccomp((string) $line->igv_amount, $calculated['igv_amount'], 4) !== 0
            || bccomp((string) $line->line_total, $calculated['line_total'], 4) !== 0
            || bccomp((string) $line->igv_rate, $calculated['igv_rate'], 4) !== 0
            || (string) $line->tax_affectation_code !== $calculated['tax_affectation_code'];
    }

    /**
     * @param  list<array<string, mixed>>  $linesInput
     */
    private function syncLines(SalesDocument $document, array $linesInput): void
    {
        $document->lines()->delete();

        $subtotal = '0';
        $taxAmount = '0';
        $total = '0';

        foreach (array_values($this->consolidateLinesInput($linesInput)) as $index => $row) {
            $variantId = $row['product_variant_id'] ?? null;
            $variant = $variantId
                ? ProductVariant::query()->with(['product', 'taxProfile'])->findOrFail($variantId)
                : null;

            $calculated = $variant
                ? $this->calculateLine($row, $variant)
                : $this->calculateManualLine($row);

            SalesDocumentLine::query()->create([
                'sales_document_id' => $document->id,
                'product_variant_id' => $variant?->id,
                'manual_sku' => $calculated['manual_sku'],
                'description' => $calculated['description'],
                'quantity' => $calculated['quantity'],
                'unit_price' => $calculated['unit_price'],
                'discount' => $calculated['discount'],
                'tax_affectation_code' => $calculated['tax_affectation_code'],
                'igv_rate' => $calculated['igv_rate'],
                'line_subtotal' => $calculated['line_subtotal'],
                'igv_amount' => $calculated['igv_amount'],
                'line_total' => $calculated['line_total'],
                'line_order' => $index,
            ]);

            $subtotal = bcadd($subtotal, $calculated['line_subtotal'], 4);
            $taxAmount = bcadd($taxAmount, $calculated['igv_amount'], 4);
            $total = bcadd($total, $calculated['line_total'], 4);
        }

        $globalDiscount = $this->money((string) $document->global_discount);

        if (bccomp($globalDiscount, '0', 4) === 1) {
            $total = bcsub($total, $globalDiscount, 4);

            if (bccomp($total, '0', 4) === -1) {
                $total = '0.0000';
            }
        }

        $document->update([
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $total,
        ]);
    }

    /**
     * Une líneas duplicadas del mismo producto sumando cantidad y descuento.
     *
     * @param  list<array<string, mixed>>  $linesInput
     * @return list<array<string, mixed>>
     */
    private function consolidateLinesInput(array $linesInput): array
    {
        $merged = [];

        foreach (array_values($linesInput) as $row) {
            if (empty($row['product_variant_id'])) {
                $merged[] = $row;
                continue;
            }

            $variantId = (string) $row['product_variant_id'];

            if (! isset($merged[$variantId])) {
                $merged[$variantId] = $row;

                continue;
            }

            $merged[$variantId]['quantity'] = bcadd(
                $this->qty((string) ($merged[$variantId]['quantity'] ?? '0')),
                $this->qty((string) ($row['quantity'] ?? '0')),
                6,
            );

            $merged[$variantId]['discount'] = bcadd(
                $this->money((string) ($merged[$variantId]['discount'] ?? '0')),
                $this->money((string) ($row['discount'] ?? '0')),
                4,
            );
        }

        return array_values($merged);
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{
     *     manual_sku: ?string,
     *     description: string,
     *     quantity: string,
     *     unit_price: string,
     *     discount: string,
     *     tax_affectation_code: string,
     *     igv_rate: string,
     *     line_subtotal: string,
     *     igv_amount: string,
     *     line_total: string
     * }
     */
    private function calculateManualLine(array $row): array
    {
        $quantity = $this->qty((string) ($row['quantity'] ?? '0'));
        $unitPrice = $this->money((string) ($row['unit_price'] ?? '0'));
        $discount = $this->money((string) ($row['discount'] ?? '0'));
        $description = trim((string) ($row['description'] ?? ''));
        $manualSku = trim((string) ($row['manual_sku'] ?? ''));

        if (bccomp($quantity, '0', 6) !== 1) {
            throw new InvalidArgumentException('La cantidad debe ser mayor a cero.');
        }

        if ($description === '') {
            throw new InvalidArgumentException('La línea manual requiere descripción.');
        }

        $lineTotal = bcsub(bcmul($quantity, $unitPrice, 4), $discount, 4);

        if (bccomp($lineTotal, '0', 4) === -1) {
            throw new InvalidArgumentException('El descuento supera el importe de la línea.');
        }

        [$lineSubtotal, $igvAmount] = $this->splitTaxInclusiveTotal($lineTotal, '0.1800');

        return [
            'manual_sku' => $manualSku !== '' ? $manualSku : null,
            'description' => $description,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'discount' => $discount,
            'tax_affectation_code' => '10',
            'igv_rate' => '0.1800',
            'line_subtotal' => $lineSubtotal,
            'igv_amount' => $igvAmount,
            'line_total' => $lineTotal,
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{
     *     manual_sku: ?string,
     *     description: ?string,
     *     quantity: string,
     *     unit_price: string,
     *     discount: string,
     *     tax_affectation_code: string,
     *     igv_rate: string,
     *     line_subtotal: string,
     *     igv_amount: string,
     *     line_total: string
     * }
     */
    public function calculateLine(array $row, ProductVariant $variant): array
    {
        $quantity = $this->qty($row['quantity'] ?? '0');
        $unitPrice = $this->money($row['unit_price'] ?? '0');
        $discount = $this->money($row['discount'] ?? '0');

        if (bccomp($quantity, '0', 6) !== 1) {
            throw new InvalidArgumentException('La cantidad debe ser mayor a cero.');
        }

        $taxProfile = $variant->taxProfile;
        $affectation = (string) ($taxProfile?->sunat_affectation_code ?? '10');
        $igvRate = $this->igvRateForAffectation($affectation, $taxProfile?->igv_rate);

        $gross = bcmul($quantity, $unitPrice, 4);
        $lineTotal = bcsub($gross, $discount, 4);

        if (bccomp($lineTotal, '0', 4) === -1) {
            throw new InvalidArgumentException('El descuento supera el importe de la línea.');
        }

        [$lineSubtotal, $igvAmount] = $this->splitTaxInclusiveTotal($lineTotal, $igvRate);

        $description = trim((string) ($row['description'] ?? ''));

        if ($description === '') {
            $productName = $variant->product?->name ?? '';
            $description = trim($productName.' · '.($variant->label ?: $variant->sku));
        }

        return [
            'manual_sku' => null,
            'description' => $description,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'discount' => $discount,
            'tax_affectation_code' => $affectation,
            'igv_rate' => $igvRate,
            'line_subtotal' => $lineSubtotal,
            'igv_amount' => $igvAmount,
            'line_total' => $lineTotal,
        ];
    }

    private function igvRateForAffectation(string $affectation, mixed $profileRate): string
    {
        if (in_array($affectation, ['20', '30', '40'], true)) {
            return '0.0000';
        }

        if ($profileRate !== null && bccomp((string) $profileRate, '0', 4) === 1) {
            return $this->normalizeIgvRateDecimal($this->money((string) $profileRate));
        }

        return '0.1800';
    }

    /**
     * Perfiles tributarios y tienda guardan IGV en % (p. ej. 18); los cálculos usan decimal (0.18).
     */
    private function normalizeIgvRateDecimal(string $rate): string
    {
        if (bccomp($rate, '1', 4) === 1) {
            return bcdiv($rate, '100', 4);
        }

        return $rate;
    }

    /**
     * El precio de catálogo / línea incluye IGV cuando aplica tasa > 0.
     *
     * @return array{0: string, 1: string} [base imponible, igv]
     */
    private function splitTaxInclusiveTotal(string $lineTotal, string $igvRate): array
    {
        if (bccomp($igvRate, '0', 4) !== 1) {
            return [$lineTotal, '0.0000'];
        }

        $divisor = bcadd('1', $igvRate, 6);
        $lineSubtotal = bcdiv($lineTotal, $divisor, 4);
        $igvAmount = bcsub($lineTotal, $lineSubtotal, 4);

        return [$lineSubtotal, $igvAmount];
    }

    private function money(string $value): string
    {
        $normalized = str_replace(',', '.', trim($value));

        if ($normalized === '' || ! is_numeric($normalized)) {
            throw new InvalidArgumentException('Importe inválido.');
        }

        return number_format((float) $normalized, 4, '.', '');
    }

    private function qty(string $value): string
    {
        $normalized = str_replace(',', '.', trim($value));

        if ($normalized === '' || ! is_numeric($normalized)) {
            throw new InvalidArgumentException('Cantidad inválida.');
        }

        return number_format((float) $normalized, 6, '.', '');
    }
}
