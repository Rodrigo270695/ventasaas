<?php

namespace App\Services\Compras;

use App\Models\Party;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Services\Sales\SalesDocumentService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PurchaseOrderService
{
    public function __construct(
        private readonly SalesDocumentService $salesLines,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, bool $approve = false): PurchaseOrder
    {
        return DB::transaction(function () use ($data, $approve) {
            $order = $this->persistOrder(new PurchaseOrder, $data, $approve);

            return $order->fresh(['lines.variant.product', 'supplier']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(PurchaseOrder $order, array $data, ?bool $approve = null): PurchaseOrder
    {
        if (! $order->isDraft()) {
            throw new InvalidArgumentException('Solo se pueden editar órdenes en borrador.');
        }

        return DB::transaction(function () use ($order, $data, $approve) {
            $shouldApprove = $approve ?? false;
            $order = $this->persistOrder($order, $data, $shouldApprove);

            return $order->fresh(['lines.variant.product', 'supplier']);
        });
    }

    public function approve(PurchaseOrder $order): PurchaseOrder
    {
        if (! $order->isDraft()) {
            throw new InvalidArgumentException('La orden ya fue aprobada o no está en borrador.');
        }

        $order->load('lines');

        if ($order->lines->isEmpty()) {
            throw new InvalidArgumentException('Agrega al menos un producto a la orden.');
        }

        $order->update([
            'status' => PurchaseOrder::STATUS_APPROVED,
            'approved_at' => now(),
        ]);

        return $order->fresh(['lines.variant.product', 'supplier']);
    }

    public function cancel(PurchaseOrder $order): PurchaseOrder
    {
        if ($order->status === PurchaseOrder::STATUS_RECEIVED) {
            throw new InvalidArgumentException('No se puede anular una orden totalmente recibida.');
        }

        if (in_array($order->status, [PurchaseOrder::STATUS_PARTIALLY_RECEIVED], true)) {
            throw new InvalidArgumentException(
                'No se puede anular: ya tiene recepciones registradas.',
            );
        }

        $order->update(['status' => PurchaseOrder::STATUS_CANCELLED]);

        return $order->fresh(['supplier']);
    }

    public function syncReceiptStatus(PurchaseOrder $order): void
    {
        $order->load('lines');

        $allReceived = true;
        $anyReceived = false;

        foreach ($order->lines as $line) {
            if (bccomp($line->quantityPending(), '0', 4) === 1) {
                $allReceived = false;
            }

            if (bccomp((string) $line->quantity_received, '0', 4) === 1) {
                $anyReceived = true;
            }
        }

        if ($allReceived && $anyReceived) {
            $order->update(['status' => PurchaseOrder::STATUS_RECEIVED]);

            return;
        }

        if ($anyReceived) {
            $order->update(['status' => PurchaseOrder::STATUS_PARTIALLY_RECEIVED]);

            return;
        }

        if ($order->status !== PurchaseOrder::STATUS_CANCELLED) {
            $order->update(['status' => PurchaseOrder::STATUS_APPROVED]);
        }
    }

    public function nextInternalNumber(): string
    {
        return $this->nextNumber('OC');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function persistOrder(PurchaseOrder $order, array $data, bool $approve): PurchaseOrder
    {
        $supplier = Party::query()->find($data['supplier_party_id'] ?? null);

        if (! $supplier || ! in_array($supplier->type, [Party::TYPE_SUPPLIER, Party::TYPE_BOTH], true)) {
            throw new InvalidArgumentException('El proveedor no es válido.');
        }

        $linesInput = $data['lines'] ?? [];

        if ($linesInput === []) {
            throw new InvalidArgumentException('Agrega al menos un producto a la orden de compra.');
        }

        if (! $order->exists) {
            $order->fill([
                'internal_number' => $this->nextInternalNumber(),
                'status' => PurchaseOrder::STATUS_DRAFT,
                'created_by' => $data['created_by'] ?? null,
            ]);
        }

        $order->fill([
            'supplier_party_id' => $supplier->id,
            'order_date' => $data['order_date'],
            'expected_date' => $data['expected_date'] ?? null,
            'currency_code' => $data['currency_code'] ?? 'PEN',
            'exchange_rate' => $data['exchange_rate'] ?? 1,
            'notes' => $data['notes'] ?? null,
        ]);

        $order->save();

        $this->syncLines($order, $linesInput);

        if ($approve) {
            $order->refresh();
            $this->approve($order);
        }

        return $order;
    }

    /**
     * @param  list<array<string, mixed>>  $linesInput
     */
    private function syncLines(PurchaseOrder $order, array $linesInput): void
    {
        $order->lines()->delete();

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
                'quantity' => $row['quantity'] ?? $row['quantity_ordered'] ?? '1',
                'unit_price' => $row['unit_cost'] ?? $row['unit_price'] ?? '0',
                'discount' => $row['discount'] ?? '0',
            ], $variant);

            PurchaseOrderLine::query()->create([
                'purchase_order_id' => $order->id,
                'product_variant_id' => $variant->id,
                'description' => $calculated['description'],
                'quantity_ordered' => $calculated['quantity'],
                'quantity_received' => '0',
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
            throw new InvalidArgumentException('El total de la orden debe ser mayor a cero.');
        }

        $order->update([
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $total,
        ]);
    }

    private function nextNumber(string $prefixCode): string
    {
        $year = now()->format('Y');
        $prefix = "{$prefixCode}-{$year}-";

        $last = PurchaseOrder::query()
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
