<?php

namespace App\Services\Compras;

use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptLine;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Models\Warehouse;
use App\Services\Inventory\StockMovementService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class GoodsReceiptService
{
    public function __construct(
        private readonly PurchaseOrderService $orders,
        private readonly StockMovementService $stock,
    ) {}

    /**
     * @param  array{
     *     purchase_order_id: string,
     *     warehouse_id: string,
     *     received_date: string,
     *     notes?: string|null,
     *     created_by?: int|null,
     *     lines: list<array{purchase_order_line_id: string, quantity: string|float}>
     * }  $data
     */
    public function create(array $data): GoodsReceipt
    {
        $order = PurchaseOrder::query()
            ->with(['lines.variant.product', 'supplier'])
            ->findOrFail($data['purchase_order_id']);

        if (! $order->canReceive()) {
            throw new InvalidArgumentException('La orden no está aprobada o ya fue recibida por completo.');
        }

        $warehouse = Warehouse::query()
            ->where('is_active', true)
            ->findOrFail($data['warehouse_id']);

        $linesInput = $data['lines'] ?? [];

        if ($linesInput === []) {
            throw new InvalidArgumentException('Indica las cantidades recibidas.');
        }

        return DB::transaction(function () use ($data, $order, $warehouse, $linesInput) {
            $receipt = GoodsReceipt::query()->create([
                'purchase_order_id' => $order->id,
                'warehouse_id' => $warehouse->id,
                'internal_number' => $this->nextInternalNumber(),
                'received_date' => $data['received_date'],
                'status' => GoodsReceipt::STATUS_CONFIRMED,
                'notes' => $data['notes'] ?? null,
                'created_by' => $data['created_by'] ?? null,
            ]);

            $receiptLines = [];
            $index = 0;

            foreach ($linesInput as $row) {
                $qty = (string) ($row['quantity'] ?? '0');

                if (bccomp($qty, '0', 4) !== 1) {
                    continue;
                }

                /** @var PurchaseOrderLine|null $orderLine */
                $orderLine = $order->lines->firstWhere('id', $row['purchase_order_line_id']);

                if (! $orderLine) {
                    throw new InvalidArgumentException('Línea de orden no válida.');
                }

                $pending = $orderLine->quantityPending();

                if (bccomp($qty, $pending, 4) === 1) {
                    throw new InvalidArgumentException(
                        "La cantidad recibida supera lo pendiente para {$orderLine->variant?->sku}.",
                    );
                }

                $unitCost = (string) $orderLine->unit_cost;
                $lineTotal = bcmul($qty, $unitCost, 4);

                $receiptLine = GoodsReceiptLine::query()->create([
                    'goods_receipt_id' => $receipt->id,
                    'purchase_order_line_id' => $orderLine->id,
                    'product_variant_id' => $orderLine->product_variant_id,
                    'quantity' => $qty,
                    'unit_cost' => $unitCost,
                    'line_total' => $lineTotal,
                    'line_order' => $index++,
                ]);

                $orderLine->update([
                    'quantity_received' => bcadd((string) $orderLine->quantity_received, $qty, 4),
                ]);

                $receiptLines[] = $receiptLine;
            }

            if ($receiptLines === []) {
                throw new InvalidArgumentException('Debes recibir al menos una unidad.');
            }

            $receipt->load('lines.variant.product');

            $movement = $this->stock->postGoodsReceiptIn(
                $warehouse,
                $receipt,
                $receipt->lines,
                $data['created_by'] ?? null,
            );

            $receipt->update(['stock_movement_id' => $movement->id]);

            $this->orders->syncReceiptStatus($order->fresh('lines'));

            return $receipt->fresh([
                'lines.variant.product',
                'purchaseOrder.supplier',
                'warehouse',
            ]);
        });
    }

    public function nextInternalNumber(): string
    {
        $year = now()->format('Y');
        $prefix = "RC-{$year}-";

        $last = GoodsReceipt::query()
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
