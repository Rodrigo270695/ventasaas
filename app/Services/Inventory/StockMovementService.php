<?php

namespace App\Services\Inventory;

use App\Models\ProductVariant;
use App\Models\GoodsReceipt;
use App\Support\Datetime\PeruDateTime;
use App\Models\GoodsReceiptLine;
use App\Models\PurchaseDocument;
use App\Models\PurchaseDocumentLine;
use App\Models\SalesDocument;
use App\Models\SalesDocumentLine;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\StockMovementLine;
use App\Models\StockTransfer;
use App\Models\Warehouse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class StockMovementService
{
    /**
     * Fija el stock disponible de una variante en un almacén (ajuste / inventario inicial).
     */
    public function setQuantityOnHand(
        Warehouse $warehouse,
        ProductVariant $variant,
        string $targetQuantity,
        ?string $unitCostForIncrease = null,
        ?string $notes = null,
        ?int $createdBy = null,
    ): StockMovement {
        $target = $this->toDecimal($targetQuantity);

        if (bccomp($target, '0', 4) === -1) {
            throw new InvalidArgumentException('La cantidad no puede ser negativa.');
        }

        return DB::transaction(function () use ($warehouse, $variant, $target, $unitCostForIncrease, $notes, $createdBy) {
            $balance = StockBalance::query()->firstOrCreate(
                [
                    'warehouse_id' => $warehouse->id,
                    'product_variant_id' => $variant->id,
                ],
                [
                    'quantity_on_hand' => '0',
                    'quantity_reserved' => '0',
                    'avg_cost' => '0',
                ],
            );

            $current = $this->normalizeDecimal((string) $balance->quantity_on_hand);
            $delta = bcsub($target, $current, 4);

            if (bccomp($delta, '0', 4) === 0) {
                if ($unitCostForIncrease !== null && bccomp($unitCostForIncrease, '0', 6) === 1) {
                    return $this->recordCostUpdate($balance, $warehouse, $variant, $unitCostForIncrease, $notes, $createdBy);
                }

                throw new InvalidArgumentException('La cantidad indicada es igual al stock actual. Si solo quieres registrar un costo, ingresa el costo unitario.');
            }

            $movementType = bccomp($current, '0', 4) === 0 && bccomp($delta, '0', 4) === 1
                ? StockMovement::TYPE_OPENING
                : StockMovement::TYPE_ADJUSTMENT;

            if (bccomp($delta, '0', 4) === 1) {
                $incomingCost = $unitCostForIncrease ?? (string) $balance->avg_cost;

                if (bccomp($incomingCost, '0', 6) !== 1) {
                    throw new InvalidArgumentException(
                        'Indica el costo unitario para el ingreso de stock.',
                    );
                }

                $newAvg = $this->weightedAverageCost(
                    $current,
                    (string) $balance->avg_cost,
                    $delta,
                    $incomingCost,
                );
                $balance->avg_cost = $newAvg;
                $lineUnitCost = $incomingCost;
            } else {
                $outgoing = ltrim($delta, '-');

                if (bccomp($current, $outgoing, 4) === -1) {
                    throw new InvalidArgumentException('No hay stock suficiente para esta salida.');
                }

                $lineUnitCost = (string) $balance->avg_cost;
            }

            $balance->quantity_on_hand = $target;
            $balance->save();

            $lineQty = $delta;
            $totalCost = bcmul($lineQty, $lineUnitCost, 6);

            $movement = StockMovement::query()->create([
                'warehouse_id' => $warehouse->id,
                'movement_type' => $movementType,
                'document_number' => $this->nextDocumentNumber(),
                'movement_date' => now(),
                'status' => StockMovement::STATUS_POSTED,
                'notes' => $notes,
                'created_by' => $createdBy,
            ]);

            StockMovementLine::query()->create([
                'stock_movement_id' => $movement->id,
                'product_variant_id' => $variant->id,
                'quantity' => $lineQty,
                'unit_cost' => $lineUnitCost,
                'total_cost' => $totalCost,
            ]);

            return $movement->load('lines');
        });
    }

    private function recordCostUpdate(
        StockBalance $balance,
        Warehouse $warehouse,
        ProductVariant $variant,
        string $unitCost,
        ?string $notes,
        ?int $createdBy,
    ): StockMovement {
        $normalizedCost = $this->normalizeDecimal($unitCost, 6);

        $balance->avg_cost = $normalizedCost;
        $balance->save();

        $movement = StockMovement::query()->create([
            'warehouse_id' => $warehouse->id,
            'movement_type' => StockMovement::TYPE_COST_UPDATE,
            'document_number' => $this->nextDocumentNumber(),
            'movement_date' => now(),
            'status' => StockMovement::STATUS_POSTED,
            'notes' => $notes,
            'created_by' => $createdBy,
        ]);

        StockMovementLine::query()->create([
            'stock_movement_id' => $movement->id,
            'product_variant_id' => $variant->id,
            'quantity' => '0.0000',
            'unit_cost' => $normalizedCost,
            'total_cost' => '0.000000',
        ]);

        return $movement->load('lines');
    }

    private function weightedAverageCost(
        string $currentQty,
        string $currentAvg,
        string $incomingQty,
        string $incomingUnitCost,
    ): string {
        if (bccomp($currentQty, '0', 4) !== 1) {
            return $this->normalizeDecimal($incomingUnitCost, 6);
        }

        $currentValue = bcmul($currentQty, $currentAvg, 6);
        $incomingValue = bcmul($incomingQty, $incomingUnitCost, 6);
        $newQty = bcadd($currentQty, $incomingQty, 4);

        return bcdiv(bcadd($currentValue, $incomingValue, 6), $newQty, 6);
    }

    /**
     * @param  Collection<int, SalesDocumentLine>|iterable<int, SalesDocumentLine>  $lines
     */
    public function postSaleOut(
        Warehouse $warehouse,
        SalesDocument $document,
        iterable $lines,
        ?int $createdBy = null,
    ): StockMovement {
        return DB::transaction(function () use ($warehouse, $document, $lines, $createdBy) {
            $movement = StockMovement::query()->create([
                'warehouse_id' => $warehouse->id,
                'movement_type' => StockMovement::TYPE_SALE_OUT,
                'reference_type' => SalesDocument::class,
                'reference_id' => $document->id,
                'document_number' => $document->full_number,
                'movement_date' => now(),
                'status' => StockMovement::STATUS_POSTED,
                'notes' => 'Salida por venta '.$document->full_number,
                'created_by' => $createdBy,
            ]);

            foreach ($lines as $line) {
                $variant = $line->variant ?? ProductVariant::query()->find($line->product_variant_id);

                if (! $variant?->product?->track_stock) {
                    continue;
                }

                $outgoing = $this->normalizeDecimal((string) $line->quantity, 4);

                $balance = StockBalance::query()->firstOrCreate(
                    [
                        'warehouse_id' => $warehouse->id,
                        'product_variant_id' => $variant->id,
                    ],
                    [
                        'quantity_on_hand' => '0',
                        'quantity_reserved' => '0',
                        'avg_cost' => '0',
                    ],
                );

                $current = $this->normalizeDecimal((string) $balance->quantity_on_hand);

                if (bccomp($current, $outgoing, 4) === -1) {
                    throw new InvalidArgumentException(
                        "Stock insuficiente para {$variant->sku} en {$warehouse->code}.",
                    );
                }

                $balance->quantity_on_hand = bcsub($current, $outgoing, 4);
                $balance->save();

                $unitCost = (string) $balance->avg_cost;
                $lineQty = '-'.$outgoing;
                $totalCost = bcmul($lineQty, $unitCost, 6);

                StockMovementLine::query()->create([
                    'stock_movement_id' => $movement->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $lineQty,
                    'unit_cost' => $unitCost,
                    'total_cost' => $totalCost,
                ]);
            }

            return $movement->load('lines');
        });
    }

    /**
     * @param  iterable<int, PurchaseDocumentLine>  $lines
     */
    public function postPurchaseIn(
        Warehouse $warehouse,
        PurchaseDocument $document,
        iterable $lines,
        ?int $createdBy = null,
    ): StockMovement {
        return DB::transaction(function () use ($warehouse, $document, $lines, $createdBy) {
            $movement = StockMovement::query()->create([
                'warehouse_id' => $warehouse->id,
                'movement_type' => StockMovement::TYPE_PURCHASE_IN,
                'reference_type' => PurchaseDocument::class,
                'reference_id' => $document->id,
                'document_number' => $document->internal_number,
                'movement_date' => $document->issue_date
                    ? PeruDateTime::parse($document->issue_date)
                    : PeruDateTime::now(),
                'status' => StockMovement::STATUS_POSTED,
                'notes' => 'Ingreso por compra '.$document->internal_number,
                'created_by' => $createdBy,
            ]);

            foreach ($lines as $line) {
                $variant = $line->variant ?? ProductVariant::query()->find($line->product_variant_id);

                if (! $variant?->product?->track_stock) {
                    continue;
                }

                $incoming = $this->normalizeDecimal((string) $line->quantity, 4);
                $unitCost = $this->normalizeDecimal((string) $line->unit_cost, 6);

                if (bccomp($incoming, '0', 4) !== 1) {
                    continue;
                }

                if (bccomp($unitCost, '0', 6) !== 1) {
                    throw new InvalidArgumentException(
                        "Indica el costo unitario para {$variant->sku}.",
                    );
                }

                $balance = StockBalance::query()->firstOrCreate(
                    [
                        'warehouse_id' => $warehouse->id,
                        'product_variant_id' => $variant->id,
                    ],
                    [
                        'quantity_on_hand' => '0',
                        'quantity_reserved' => '0',
                        'avg_cost' => '0',
                    ],
                );

                $current = $this->normalizeDecimal((string) $balance->quantity_on_hand);
                $balance->avg_cost = $this->weightedAverageCost(
                    $current,
                    (string) $balance->avg_cost,
                    $incoming,
                    $unitCost,
                );
                $balance->quantity_on_hand = bcadd($current, $incoming, 4);
                $balance->save();

                $totalCost = bcmul($incoming, $unitCost, 6);

                StockMovementLine::query()->create([
                    'stock_movement_id' => $movement->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $incoming,
                    'unit_cost' => $unitCost,
                    'total_cost' => $totalCost,
                ]);
            }

            return $movement->load('lines');
        });
    }

    /**
     * @param  iterable<int, GoodsReceiptLine>  $lines
     */
    public function postGoodsReceiptIn(
        Warehouse $warehouse,
        GoodsReceipt $receipt,
        iterable $lines,
        ?int $createdBy = null,
    ): StockMovement {
        return DB::transaction(function () use ($warehouse, $receipt, $lines, $createdBy) {
            $movement = StockMovement::query()->create([
                'warehouse_id' => $warehouse->id,
                'movement_type' => StockMovement::TYPE_PURCHASE_IN,
                'reference_type' => GoodsReceipt::class,
                'reference_id' => $receipt->id,
                'document_number' => $receipt->internal_number,
                'movement_date' => $receipt->received_date ?? now(),
                'status' => StockMovement::STATUS_POSTED,
                'notes' => 'Ingreso por recepción '.$receipt->internal_number,
                'created_by' => $createdBy,
            ]);

            foreach ($lines as $line) {
                $variant = $line->variant ?? ProductVariant::query()->find($line->product_variant_id);

                if (! $variant?->product?->track_stock) {
                    continue;
                }

                $incoming = $this->normalizeDecimal((string) $line->quantity, 4);
                $unitCost = $this->normalizeDecimal((string) $line->unit_cost, 6);

                if (bccomp($incoming, '0', 4) !== 1) {
                    continue;
                }

                if (bccomp($unitCost, '0', 6) !== 1) {
                    throw new InvalidArgumentException(
                        "Indica el costo unitario para {$variant->sku}.",
                    );
                }

                $balance = StockBalance::query()->firstOrCreate(
                    [
                        'warehouse_id' => $warehouse->id,
                        'product_variant_id' => $variant->id,
                    ],
                    [
                        'quantity_on_hand' => '0',
                        'quantity_reserved' => '0',
                        'avg_cost' => '0',
                    ],
                );

                $current = $this->normalizeDecimal((string) $balance->quantity_on_hand);
                $balance->avg_cost = $this->weightedAverageCost(
                    $current,
                    (string) $balance->avg_cost,
                    $incoming,
                    $unitCost,
                );
                $balance->quantity_on_hand = bcadd($current, $incoming, 4);
                $balance->save();

                $totalCost = bcmul($incoming, $unitCost, 6);

                StockMovementLine::query()->create([
                    'stock_movement_id' => $movement->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $incoming,
                    'unit_cost' => $unitCost,
                    'total_cost' => $totalCost,
                ]);
            }

            return $movement->load('lines');
        });
    }

    public function transferBetweenWarehouses(
        Warehouse $from,
        Warehouse $to,
        ProductVariant $variant,
        string $quantity,
        ?string $notes = null,
        ?int $createdBy = null,
    ): StockTransfer {
        if ($from->id === $to->id) {
            throw new InvalidArgumentException('El almacén de origen y destino deben ser distintos.');
        }

        $variant->loadMissing('product');

        if (! $variant->product?->track_stock) {
            throw new InvalidArgumentException('Este producto no controla inventario.');
        }

        $qty = $this->toDecimal($quantity);

        if (bccomp($qty, '0', 4) !== 1) {
            throw new InvalidArgumentException('La cantidad a trasladar debe ser mayor a cero.');
        }

        return DB::transaction(function () use ($from, $to, $variant, $qty, $notes, $createdBy) {
            $sourceBalance = $this->getOrCreateBalance($from, $variant);
            $current = $this->normalizeDecimal((string) $sourceBalance->quantity_on_hand);

            if (bccomp($current, $qty, 4) === -1) {
                throw new InvalidArgumentException(
                    "Stock insuficiente en {$from->code} para {$variant->sku}.",
                );
            }

            $unitCost = (string) $sourceBalance->avg_cost;

            $transfer = StockTransfer::query()->create([
                'from_warehouse_id' => $from->id,
                'to_warehouse_id' => $to->id,
                'product_variant_id' => $variant->id,
                'quantity' => $qty,
                'notes' => $notes,
                'created_by' => $createdBy,
            ]);

            $documentNumber = 'TRF-'.now()->format('YmdHis');

            $sourceBalance->quantity_on_hand = bcsub($current, $qty, 4);
            $sourceBalance->save();

            $outMovement = StockMovement::query()->create([
                'warehouse_id' => $from->id,
                'movement_type' => StockMovement::TYPE_TRANSFER_OUT,
                'reference_type' => StockTransfer::class,
                'reference_id' => $transfer->id,
                'document_number' => $documentNumber,
                'movement_date' => now(),
                'status' => StockMovement::STATUS_POSTED,
                'notes' => trim("Traslado a {$to->code}. ".($notes ?? '')),
                'created_by' => $createdBy,
            ]);

            $outQty = '-'.$qty;
            StockMovementLine::query()->create([
                'stock_movement_id' => $outMovement->id,
                'product_variant_id' => $variant->id,
                'quantity' => $outQty,
                'unit_cost' => $unitCost,
                'total_cost' => bcmul($outQty, $unitCost, 6),
            ]);

            $destBalance = $this->getOrCreateBalance($to, $variant);
            $destCurrent = $this->normalizeDecimal((string) $destBalance->quantity_on_hand);
            $destAvg = (string) $destBalance->avg_cost;

            if (bccomp($destCurrent, '0', 4) === 1) {
                $destBalance->avg_cost = $this->weightedAverageCost(
                    $destCurrent,
                    $destAvg,
                    $qty,
                    $unitCost,
                );
            } else {
                $destBalance->avg_cost = $unitCost;
            }

            $destBalance->quantity_on_hand = bcadd($destCurrent, $qty, 4);
            $destBalance->save();

            $inMovement = StockMovement::query()->create([
                'warehouse_id' => $to->id,
                'movement_type' => StockMovement::TYPE_TRANSFER_IN,
                'reference_type' => StockTransfer::class,
                'reference_id' => $transfer->id,
                'document_number' => $documentNumber,
                'movement_date' => now(),
                'status' => StockMovement::STATUS_POSTED,
                'notes' => trim("Traslado desde {$from->code}. ".($notes ?? '')),
                'created_by' => $createdBy,
            ]);

            StockMovementLine::query()->create([
                'stock_movement_id' => $inMovement->id,
                'product_variant_id' => $variant->id,
                'quantity' => $qty,
                'unit_cost' => $unitCost,
                'total_cost' => bcmul($qty, $unitCost, 6),
            ]);

            return $transfer->load(['fromWarehouse', 'toWarehouse', 'variant']);
        });
    }

    public function breakdownPackaging(
        Warehouse $warehouse,
        ProductVariant $fromVariant,
        ProductVariant $toVariant,
        string $quantityFrom,
        string $quantityTo,
        ?string $notes = null,
        ?int $createdBy = null,
    ): StockMovement {
        if ($fromVariant->product_id !== $toVariant->product_id) {
            throw new InvalidArgumentException(
                'Las variantes deben pertenecer al mismo producto.',
            );
        }

        $fromVariant->loadMissing('product');

        if (! $fromVariant->product?->track_stock) {
            throw new InvalidArgumentException('Este producto no controla inventario.');
        }

        $qtyFrom = $this->toDecimal($quantityFrom);
        $qtyTo = $this->toDecimal($quantityTo);

        if (bccomp($qtyFrom, '0', 4) !== 1 || bccomp($qtyTo, '0', 4) !== 1) {
            throw new InvalidArgumentException('Las cantidades deben ser mayores a cero.');
        }

        return DB::transaction(function () use (
            $warehouse,
            $fromVariant,
            $toVariant,
            $qtyFrom,
            $qtyTo,
            $notes,
            $createdBy,
        ) {
            $fromBalance = $this->getOrCreateBalance($warehouse, $fromVariant);
            $fromCurrent = $this->normalizeDecimal((string) $fromBalance->quantity_on_hand);

            if (bccomp($fromCurrent, $qtyFrom, 4) === -1) {
                throw new InvalidArgumentException(
                    "Stock insuficiente de {$fromVariant->sku} en {$warehouse->code}.",
                );
            }

            $fromUnitCost = (string) $fromBalance->avg_cost;
            $totalValue = bcmul($qtyFrom, $fromUnitCost, 6);
            $toUnitCost = bcdiv($totalValue, $qtyTo, 6);

            $fromBalance->quantity_on_hand = bcsub($fromCurrent, $qtyFrom, 4);
            $fromBalance->save();

            $toBalance = $this->getOrCreateBalance($warehouse, $toVariant);
            $toCurrent = $this->normalizeDecimal((string) $toBalance->quantity_on_hand);
            $toAvg = (string) $toBalance->avg_cost;

            if (bccomp($toCurrent, '0', 4) === 1) {
                $toBalance->avg_cost = $this->weightedAverageCost(
                    $toCurrent,
                    $toAvg,
                    $qtyTo,
                    $toUnitCost,
                );
            } else {
                $toBalance->avg_cost = $toUnitCost;
            }

            $toBalance->quantity_on_hand = bcadd($toCurrent, $qtyTo, 4);
            $toBalance->save();

            $documentNumber = 'DSG-'.now()->format('YmdHis');

            $movement = StockMovement::query()->create([
                'warehouse_id' => $warehouse->id,
                'movement_type' => StockMovement::TYPE_BREAKDOWN,
                'document_number' => $documentNumber,
                'movement_date' => now(),
                'status' => StockMovement::STATUS_POSTED,
                'notes' => $notes ?? "Desglose {$fromVariant->sku} → {$toVariant->sku}",
                'created_by' => $createdBy,
            ]);

            $outQty = '-'.$qtyFrom;
            StockMovementLine::query()->create([
                'stock_movement_id' => $movement->id,
                'product_variant_id' => $fromVariant->id,
                'quantity' => $outQty,
                'unit_cost' => $fromUnitCost,
                'total_cost' => bcmul($outQty, $fromUnitCost, 6),
            ]);

            StockMovementLine::query()->create([
                'stock_movement_id' => $movement->id,
                'product_variant_id' => $toVariant->id,
                'quantity' => $qtyTo,
                'unit_cost' => $toUnitCost,
                'total_cost' => bcmul($qtyTo, $toUnitCost, 6),
            ]);

            return $movement->load('lines');
        });
    }

    private function getOrCreateBalance(Warehouse $warehouse, ProductVariant $variant): StockBalance
    {
        return StockBalance::query()->firstOrCreate(
            [
                'warehouse_id' => $warehouse->id,
                'product_variant_id' => $variant->id,
            ],
            [
                'quantity_on_hand' => '0',
                'quantity_reserved' => '0',
                'avg_cost' => '0',
            ],
        );
    }

    private function nextDocumentNumber(): string
    {
        return 'ADJ-'.now()->format('YmdHis').'-'.strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
    }

    private function toDecimal(string $value): string
    {
        $normalized = str_replace(',', '.', trim($value));

        if ($normalized === '' || ! is_numeric($normalized)) {
            throw new InvalidArgumentException('Cantidad inválida.');
        }

        return $this->normalizeDecimal($normalized, 4);
    }

    private function normalizeDecimal(string $value, int $scale = 4): string
    {
        return number_format((float) $value, $scale, '.', '');
    }
}
