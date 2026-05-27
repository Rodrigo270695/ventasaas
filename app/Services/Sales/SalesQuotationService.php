<?php

namespace App\Services\Sales;

use App\Models\Party;
use App\Models\ProductVariant;
use App\Models\SalesQuotation;
use App\Models\SalesQuotationLine;
use App\Models\SalesDocument;
use App\Support\Datetime\PeruDateTime;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SalesQuotationService
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function saveDraft(array $payload, ?SalesQuotation $existing = null, ?int $userId = null): SalesQuotation
    {
        if ($existing && ! $existing->isDraft()) {
            throw new InvalidArgumentException('Solo se pueden editar cotizaciones en borrador.');
        }

        return DB::transaction(function () use ($payload, $existing, $userId) {
            $customer = Party::query()
                ->whereIn('type', [Party::TYPE_CUSTOMER, Party::TYPE_BOTH])
                ->findOrFail($payload['customer_party_id']);

            $attributes = [
                'customer_party_id' => $customer->id,
                'issue_date' => $payload['issue_date'],
                'valid_until' => $payload['valid_until'] ?? null,
                'currency_code' => $payload['currency_code'] ?? 'PEN',
                'exchange_rate' => $payload['exchange_rate'] ?? '1',
                'global_discount' => $this->money($payload['global_discount'] ?? '0'),
                'notes' => $payload['notes'] ?? null,
                'status' => SalesQuotation::STATUS_DRAFT,
            ];

            if ($existing) {
                $existing->update($attributes);
                $quotation = $existing;
            } else {
                $quotation = SalesQuotation::query()->create([
                    ...$attributes,
                    'internal_number' => $this->nextInternalNumber(),
                    'created_by' => $userId,
                ]);
            }

            $this->syncLines($quotation, $payload['lines'] ?? []);

            return $quotation->fresh(['lines.variant.product', 'customer']);
        });
    }

    public function markAsSent(SalesQuotation $quotation, string $toEmail, array $ccEmails = []): SalesQuotation
    {
        if (! $quotation->isDraft()) {
            throw new InvalidArgumentException('Solo puedes enviar por correo cotizaciones en borrador.');
        }

        $toEmail = strtolower(trim($toEmail));

        if (! filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('El correo del cliente no es válido.');
        }

        $cc = collect($ccEmails)
            ->map(fn ($email) => strtolower(trim((string) $email)))
            ->filter(fn ($email) => $email !== '' && $email !== $toEmail)
            ->unique()
            ->values()
            ->all();

        foreach ($cc as $email) {
            if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException("El correo en copia «{$email}» no es válido.");
            }
        }

        $quotation->update([
            'status' => SalesQuotation::STATUS_SENT,
            'customer_email_to' => $toEmail,
            'customer_email_cc' => $cc === [] ? null : $cc,
            'customer_email_sent_at' => now(),
            'status_changed_at' => now(),
        ]);

        return $quotation->fresh(['lines.variant.product', 'customer']);
    }

    public function markStatus(SalesQuotation $quotation, string $status): SalesQuotation
    {
        if (! in_array($status, [
            SalesQuotation::STATUS_ACCEPTED,
            SalesQuotation::STATUS_REJECTED,
            SalesQuotation::STATUS_CANCELLED,
        ], true)) {
            throw new InvalidArgumentException('Estado de cotización no válido.');
        }

        if ($quotation->sales_document_id && $status === SalesQuotation::STATUS_CANCELLED) {
            throw new InvalidArgumentException('No puedes anular una cotización que ya fue convertida a comprobante.');
        }

        $quotation->update([
            'status' => $status,
            'status_changed_at' => now(),
        ]);

        return $quotation->fresh(['lines.variant.product', 'customer']);
    }

    public function duplicate(SalesQuotation $quotation, ?int $userId = null): SalesQuotation
    {
        $quotation->loadMissing(['lines']);

        return DB::transaction(function () use ($quotation, $userId) {
            $copy = SalesQuotation::query()->create([
                'internal_number' => $this->nextInternalNumber(),
                'customer_party_id' => $quotation->customer_party_id,
                'issue_date' => now(),
                'valid_until' => now()->addDays(7)->toDateString(),
                'currency_code' => $quotation->currency_code,
                'exchange_rate' => $quotation->exchange_rate,
                'subtotal' => $quotation->subtotal,
                'tax_amount' => $quotation->tax_amount,
                'total' => $quotation->total,
                'global_discount' => $quotation->global_discount,
                'status' => SalesQuotation::STATUS_DRAFT,
                'notes' => $quotation->notes,
                'created_by' => $userId,
            ]);

            foreach ($quotation->lines as $line) {
                SalesQuotationLine::query()->create([
                    'sales_quotation_id' => $copy->id,
                    'product_variant_id' => $line->product_variant_id,
                    'manual_sku' => $line->manual_sku,
                    'description' => $line->description,
                    'quantity' => $line->quantity,
                    'unit_price' => $line->unit_price,
                    'discount' => $line->discount,
                    'tax_affectation_code' => $line->tax_affectation_code,
                    'igv_rate' => $line->igv_rate,
                    'line_subtotal' => $line->line_subtotal,
                    'igv_amount' => $line->igv_amount,
                    'line_total' => $line->line_total,
                    'line_order' => $line->line_order,
                ]);
            }

            return $copy->fresh(['lines.variant.product', 'customer']);
        });
    }

    public function convertToSalesDocumentDraft(
        SalesQuotation $quotation,
        SalesDocumentService $salesDocumentService,
        string $documentSeriesId,
        ?string $warehouseId = null,
        ?int $userId = null,
    ): SalesDocument {
        $quotation->loadMissing(['lines', 'customer', 'salesDocument']);

        if ($quotation->salesDocument) {
            return $quotation->salesDocument->fresh(['lines.variant.product', 'customer', 'documentSeries']);
        }

        if (! in_array($quotation->status, [SalesQuotation::STATUS_SENT, SalesQuotation::STATUS_ACCEPTED], true)) {
            throw new InvalidArgumentException('Solo puedes convertir cotizaciones enviadas o aceptadas.');
        }

        return DB::transaction(function () use ($quotation, $salesDocumentService, $documentSeriesId, $warehouseId, $userId) {
            $payload = [
                'document_series_id' => $documentSeriesId,
                'customer_party_id' => $quotation->customer_party_id,
                'warehouse_id' => $warehouseId,
                'issue_date' => now()->toDateString(),
                'due_date' => $quotation->valid_until
                    ? PeruDateTime::parse($quotation->valid_until)->toDateString()
                    : null,
                'currency_code' => $quotation->currency_code,
                'exchange_rate' => (string) $quotation->exchange_rate,
                'global_discount' => (string) $quotation->global_discount,
                'notes' => trim((string) $quotation->notes."\n\nOrigen: ".$quotation->internal_number),
                'lines' => $quotation->lines->map(fn ($line) => [
                    'product_variant_id' => $line->product_variant_id,
                    'manual_sku' => $line->manual_sku,
                    'description' => $line->description,
                    'quantity' => (string) $line->quantity,
                    'unit_price' => (string) $line->unit_price,
                    'discount' => (string) $line->discount,
                ])->values()->all(),
            ];

            $document = $salesDocumentService->saveDraft($payload, null, $userId);

            $quotation->update([
                'sales_document_id' => $document->id,
                'status' => SalesQuotation::STATUS_ACCEPTED,
                'status_changed_at' => now(),
            ]);

            return $document;
        });
    }

    /**
     * @param  list<array<string, mixed>>  $linesInput
     */
    private function syncLines(SalesQuotation $quotation, array $linesInput): void
    {
        $quotation->lines()->delete();

        $subtotal = '0';
        $taxAmount = '0';
        $total = '0';

        foreach (array_values($linesInput) as $index => $row) {
            $variantId = $row['product_variant_id'] ?? null;
            $variant = $variantId
                ? ProductVariant::query()->with(['product', 'taxProfile'])->find($variantId)
                : null;

            $line = $this->calculateLine($row, $variant);

            SalesQuotationLine::query()->create([
                'sales_quotation_id' => $quotation->id,
                'product_variant_id' => $variant?->id,
                'manual_sku' => $line['manual_sku'],
                'description' => $line['description'],
                'quantity' => $line['quantity'],
                'unit_price' => $line['unit_price'],
                'discount' => $line['discount'],
                'tax_affectation_code' => $line['tax_affectation_code'],
                'igv_rate' => $line['igv_rate'],
                'line_subtotal' => $line['line_subtotal'],
                'igv_amount' => $line['igv_amount'],
                'line_total' => $line['line_total'],
                'line_order' => $index,
            ]);

            $subtotal = bcadd($subtotal, $line['line_subtotal'], 4);
            $taxAmount = bcadd($taxAmount, $line['igv_amount'], 4);
            $total = bcadd($total, $line['line_total'], 4);
        }

        $globalDiscount = $this->money((string) $quotation->global_discount);

        if (bccomp($globalDiscount, '0', 4) === 1) {
            $total = bcsub($total, $globalDiscount, 4);

            if (bccomp($total, '0', 4) === -1) {
                $total = '0.0000';
            }
        }

        $quotation->update([
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $total,
        ]);
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{
     *   manual_sku: ?string,
     *   description: string,
     *   quantity: string,
     *   unit_price: string,
     *   discount: string,
     *   tax_affectation_code: string,
     *   igv_rate: string,
     *   line_subtotal: string,
     *   igv_amount: string,
     *   line_total: string
     * }
     */
    private function calculateLine(array $row, ?ProductVariant $variant): array
    {
        $quantity = $this->qty((string) ($row['quantity'] ?? '0'));
        $unitPrice = $this->money((string) ($row['unit_price'] ?? '0'));
        $discount = $this->money((string) ($row['discount'] ?? '0'));

        if (bccomp($quantity, '0', 6) !== 1) {
            throw new InvalidArgumentException('La cantidad debe ser mayor a cero.');
        }

        $description = trim((string) ($row['description'] ?? ''));
        $manualSku = trim((string) ($row['manual_sku'] ?? ''));

        if ($description === '') {
            if ($variant) {
                $description = trim(
                    ($variant->product?->name ?? 'Producto').' · '.($variant->label ?: $variant->sku),
                );
            } else {
                throw new InvalidArgumentException('La línea manual requiere descripción.');
            }
        }

        $affectation = $variant?->taxProfile?->sunat_affectation_code ?? '10';
        $igvRate = $this->normalizeIgvRateDecimal((string) ($variant?->taxProfile?->igv_rate ?? '0.18'));

        if (in_array($affectation, ['20', '30', '40'], true)) {
            $igvRate = '0.0000';
        }

        $gross = bcmul($quantity, $unitPrice, 4);
        $lineTotal = bcsub($gross, $discount, 4);

        if (bccomp($lineTotal, '0', 4) === -1) {
            throw new InvalidArgumentException('El descuento supera el importe de la línea.');
        }

        [$lineSubtotal, $igvAmount] = $this->splitTaxInclusiveTotal($lineTotal, $igvRate);

        return [
            'manual_sku' => $manualSku !== '' ? $manualSku : null,
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

    private function nextInternalNumber(): string
    {
        $prefix = 'COT-'.now()->format('Y');

        $last = SalesQuotation::query()
            ->where('internal_number', 'like', $prefix.'-%')
            ->lockForUpdate()
            ->orderByDesc('internal_number')
            ->value('internal_number');

        if (! $last) {
            return $prefix.'-000001';
        }

        $correlative = (int) substr((string) $last, -6) + 1;

        return sprintf('%s-%06d', $prefix, $correlative);
    }

    /**
     * @return array{0: string, 1: string}
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

    private function normalizeIgvRateDecimal(string $rate): string
    {
        $value = $this->money($rate);

        if (bccomp($value, '1', 4) === 1) {
            return bcdiv($value, '100', 4);
        }

        return $value;
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

