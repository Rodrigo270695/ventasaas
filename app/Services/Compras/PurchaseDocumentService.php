<?php

namespace App\Services\Compras;

use App\Models\Party;
use App\Models\ProductVariant;
use App\Models\GoodsReceipt;
use App\Models\PurchaseDocument;
use App\Models\PurchaseDocumentLine;
use App\Models\Warehouse;
use App\Services\Inventory\StockMovementService;
use App\Services\Sales\SalesDocumentService;
use App\Services\Treasury\PaymentDisbursementService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

class PurchaseDocumentService
{
    public function __construct(
        private readonly SalesDocumentService $salesLines,
        private readonly StockMovementService $stock,
        private readonly PaymentDisbursementService $disbursements,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function createConfirmed(array $data, ?UploadedFile $invoiceFile = null): PurchaseDocument
    {
        if (! empty($data['goods_receipt_id'])) {
            return $this->createFromGoodsReceipt($data, $invoiceFile);
        }

        $supplier = Party::query()->find($data['supplier_party_id'] ?? null);

        if (! $supplier || ! in_array($supplier->type, [Party::TYPE_SUPPLIER, Party::TYPE_BOTH], true)) {
            throw new InvalidArgumentException('El proveedor no es válido.');
        }

        $linesInput = $data['lines'] ?? [];

        if ($linesInput === []) {
            throw new InvalidArgumentException('Agrega al menos un producto a la factura de compra.');
        }

        $warehouse = null;

        if (! empty($data['warehouse_id'])) {
            $warehouse = Warehouse::query()
                ->where('is_active', true)
                ->find($data['warehouse_id']);
        }

        return DB::transaction(function () use ($data, $invoiceFile, $supplier, $linesInput, $warehouse) {
            $document = PurchaseDocument::query()->create([
                'supplier_party_id' => $supplier->id,
                'warehouse_id' => $warehouse?->id,
                'internal_number' => $this->nextInternalNumber(),
                'supplier_document_number' => $data['supplier_document_number'] ?? null,
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'] ?? null,
                'currency_code' => $data['currency_code'] ?? 'PEN',
                'exchange_rate' => $data['exchange_rate'] ?? 1,
                'subtotal' => 0,
                'tax_amount' => 0,
                'total' => 0,
                'status' => PurchaseDocument::STATUS_CONFIRMED,
                'payment_status' => PurchaseDocument::PAYMENT_UNPAID,
                'notes' => $data['notes'] ?? null,
                'created_by' => $data['created_by'] ?? null,
            ]);

            $this->syncLines($document, $linesInput);

            if ($invoiceFile) {
                $this->storeInvoiceFile($document, $invoiceFile);
            }

            $document->load('lines.variant.product');

            if (! $document->stockAlreadyPostedViaReceipt()) {
                $needsStock = $document->lines->contains(
                    fn (PurchaseDocumentLine $line) => $line->variant?->product?->track_stock,
                );

                if ($needsStock && ! $warehouse) {
                    throw new InvalidArgumentException(
                        'Selecciona el almacén donde ingresará la mercadería.',
                    );
                }

                if ($warehouse) {
                    $movement = $this->stock->postPurchaseIn(
                        $warehouse,
                        $document,
                        $document->lines,
                        $data['created_by'] ?? null,
                    );

                    $document->update(['stock_movement_id' => $movement->id]);
                }
            }

            return $document->fresh(['lines.variant.product', 'supplier', 'warehouse']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createFromGoodsReceipt(array $data, ?UploadedFile $invoiceFile = null): PurchaseDocument
    {
        $receipt = GoodsReceipt::query()
            ->with(['lines.variant.product', 'purchaseOrder.supplier', 'warehouse', 'purchaseDocument'])
            ->findOrFail($data['goods_receipt_id']);

        if ($receipt->purchaseDocument) {
            throw new InvalidArgumentException('Esta recepción ya tiene factura de compra registrada.');
        }

        $order = $receipt->purchaseOrder;
        $supplier = $order?->supplier;

        if (! $supplier) {
            throw new InvalidArgumentException('La recepción no tiene proveedor asociado.');
        }

        return DB::transaction(function () use ($data, $invoiceFile, $receipt, $order, $supplier) {
            $document = PurchaseDocument::query()->create([
                'supplier_party_id' => $supplier->id,
                'purchase_order_id' => $order->id,
                'goods_receipt_id' => $receipt->id,
                'warehouse_id' => $receipt->warehouse_id,
                'internal_number' => $this->nextInternalNumber(),
                'supplier_document_number' => $data['supplier_document_number'] ?? null,
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'] ?? null,
                'currency_code' => $data['currency_code'] ?? $order->currency_code,
                'exchange_rate' => $data['exchange_rate'] ?? $order->exchange_rate,
                'subtotal' => 0,
                'tax_amount' => 0,
                'total' => 0,
                'status' => PurchaseDocument::STATUS_CONFIRMED,
                'payment_status' => PurchaseDocument::PAYMENT_UNPAID,
                'notes' => $data['notes'] ?? null,
                'created_by' => $data['created_by'] ?? null,
            ]);

            $linesInput = [];

            foreach ($receipt->lines as $index => $receiptLine) {
                $linesInput[] = [
                    'goods_receipt_line_id' => $receiptLine->id,
                    'product_variant_id' => $receiptLine->product_variant_id,
                    'quantity' => (string) $receiptLine->quantity,
                    'unit_cost' => (string) $receiptLine->unit_cost,
                    'description' => $receiptLine->variant?->product?->name,
                ];
            }

            if (! empty($data['lines'])) {
                $this->assertReceiptLineQuantities($receipt, $data['lines']);
                $linesInput = $data['lines'];
            }

            $this->syncLines($document, $linesInput);

            if ($invoiceFile) {
                $this->storeInvoiceFile($document, $invoiceFile);
            }

            return $document->fresh([
                'lines.variant.product',
                'supplier',
                'warehouse',
                'purchaseOrder',
                'goodsReceipt',
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PurchaseDocument $document, array $data, ?UploadedFile $invoiceFile = null): PurchaseDocument
    {
        if ($this->disbursements->amountPaid($document) > 0.0001) {
            throw new InvalidArgumentException('No se puede editar una factura con pagos registrados.');
        }

        if ($document->stock_movement_id) {
            return $this->updateAfterStockPosted($document, $data, $invoiceFile);
        }

        return DB::transaction(function () use ($document, $data, $invoiceFile) {
            $document->update([
                'supplier_party_id' => $data['supplier_party_id'],
                'supplier_document_number' => $data['supplier_document_number'] ?? null,
                'issue_date' => $data['issue_date'],
                'due_date' => $data['due_date'] ?? null,
                'currency_code' => $data['currency_code'] ?? 'PEN',
                'exchange_rate' => $data['exchange_rate'] ?? 1,
                'notes' => $data['notes'] ?? null,
                'warehouse_id' => $data['warehouse_id'] ?? null,
            ]);

            if (! empty($data['lines'])) {
                $this->syncLines($document, $data['lines']);
            }

            if ($invoiceFile) {
                $this->deleteInvoiceFile($document);
                $this->storeInvoiceFile($document, $invoiceFile);
            }

            $document->load('lines.variant.product');
            $warehouse = $document->warehouse_id
                ? Warehouse::query()->find($document->warehouse_id)
                : null;

            $needsStock = $document->lines->contains(
                fn (PurchaseDocumentLine $line) => $line->variant?->product?->track_stock,
            );

            if ($needsStock && ! $warehouse) {
                throw new InvalidArgumentException(
                    'Selecciona el almacén donde ingresará la mercadería.',
                );
            }

            if ($warehouse && ! $document->stock_movement_id) {
                $movement = $this->stock->postPurchaseIn(
                    $warehouse,
                    $document,
                    $document->lines,
                    $data['updated_by'] ?? null,
                );

                $document->update(['stock_movement_id' => $movement->id]);
            }

            $this->disbursements->syncPurchaseDocumentPaymentStatus($document->fresh());

            return $document->fresh(['lines.variant.product', 'supplier', 'warehouse']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function updateAfterStockPosted(
        PurchaseDocument $document,
        array $data,
        ?UploadedFile $invoiceFile,
    ): PurchaseDocument {
        $document->update([
            'notes' => $data['notes'] ?? $document->notes,
        ]);

        if ($invoiceFile) {
            $this->deleteInvoiceFile($document);
            $this->storeInvoiceFile($document, $invoiceFile);
        }

        return $document->fresh(['lines.variant.product', 'supplier', 'warehouse']);
    }

    /**
     * @param  list<array<string, mixed>>  $linesInput
     */
    private function syncLines(PurchaseDocument $document, array $linesInput): void
    {
        $document->lines()->delete();

        $subtotal = '0';
        $taxAmount = '0';
        $total = '0';

        foreach (array_values($linesInput) as $index => $row) {
            if (empty($row['product_variant_id'])) {
                continue;
            }

            $variant = ProductVariant::query()
                ->with(['product', 'taxProfile'])
                ->findOrFail($row['product_variant_id']);

            $calculated = $this->salesLines->calculateLine([
                ...$row,
                'unit_price' => $row['unit_cost'] ?? $row['unit_price'] ?? '0',
                'discount' => $row['discount'] ?? '0',
            ], $variant);

            PurchaseDocumentLine::query()->create([
                'purchase_document_id' => $document->id,
                'product_variant_id' => $variant->id,
                'description' => $calculated['description'],
                'quantity' => $calculated['quantity'],
                'unit_cost' => $calculated['unit_price'],
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

        if (bccomp($total, '0', 4) !== 1) {
            throw new InvalidArgumentException('El total de la factura debe ser mayor a cero.');
        }

        $document->update([
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $total,
        ]);
    }

    private function storeInvoiceFile(PurchaseDocument $document, UploadedFile $file): void
    {
        $path = $file->store("purchase-invoices/{$document->id}", 'local');

        $document->update([
            'invoice_file_path' => $path,
            'invoice_file_name' => $file->getClientOriginalName(),
        ]);
    }

    private function deleteInvoiceFile(PurchaseDocument $document): void
    {
        if ($document->invoice_file_path) {
            Storage::disk('local')->delete($document->invoice_file_path);
        }
    }

    /**
     * @param  list<array<string, mixed>>  $linesInput
     */
    private function assertReceiptLineQuantities(GoodsReceipt $receipt, array $linesInput): void
    {
        $receipt->loadMissing('lines');

        if (count($linesInput) !== $receipt->lines->count()) {
            throw new InvalidArgumentException(
                'Las líneas de la factura deben coincidir con la recepción (mismos productos y cantidades).',
            );
        }

        $receiptLinesById = $receipt->lines->keyBy('id');
        $matchedReceiptLineIds = [];

        foreach ($linesInput as $line) {
            $receiptLineId = $line['goods_receipt_line_id'] ?? null;

            if ($receiptLineId) {
                $receiptLine = $receiptLinesById->get($receiptLineId);
            } else {
                $variantId = $line['product_variant_id'] ?? null;
                $receiptLine = $receipt->lines->first(
                    fn ($receiptLine) => $receiptLine->product_variant_id === $variantId
                        && ! in_array($receiptLine->id, $matchedReceiptLineIds, true),
                );
            }

            if (! $receiptLine) {
                throw new InvalidArgumentException(
                    'No puedes agregar ni quitar productos respecto a la recepción.',
                );
            }

            $matchedReceiptLineIds[] = $receiptLine->id;

            if (bccomp((string) $receiptLine->quantity, (string) $line['quantity'], 4) !== 0) {
                throw new InvalidArgumentException(
                    'Las cantidades de la factura deben ser las mismas que en la recepción. Solo puedes ajustar el costo unitario.',
                );
            }
        }
    }

    public function nextInternalNumber(): string
    {
        $year = now()->format('Y');
        $prefix = "FP-{$year}-";

        $last = PurchaseDocument::query()
            ->where('internal_number', 'like', $prefix.'%')
            ->orderByDesc('internal_number')
            ->value('internal_number');

        $sequence = 1;

        if ($last && preg_match('/-(\d+)$/', $last, $matches)) {
            $sequence = (int) $matches[1] + 1;
        }

        return $prefix.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }
}
