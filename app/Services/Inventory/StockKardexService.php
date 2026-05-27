<?php

namespace App\Services\Inventory;

use App\Models\StockMovement;
use App\Models\StockMovementLine;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class StockKardexService
{
    /**
     * @param  array{
     *     warehouse_id?: string|null,
     *     product_variant_id?: string|null,
     *     movement_type?: string|null,
     *     date_from?: string|null,
     *     date_to?: string|null,
     * }  $filters
     * @return Collection<int, StockMovementLine>
     */
    public function linesQuery(array $filters): Collection
    {
        $warehouseId = $filters['warehouse_id'] ?? null;
        $variantId = $filters['product_variant_id'] ?? null;
        $movementType = $filters['movement_type'] ?? null;
        $dateFrom = $filters['date_from'] ?? null;
        $dateTo = $filters['date_to'] ?? null;

        return StockMovementLine::query()
            ->with([
                'movement.warehouse:id,code,name',
                'movement.creator:id,name',
                'variant:id,product_id,sku,label',
                'variant.product:id,name',
            ])
            ->whereHas('movement', function (Builder $query) use (
                $warehouseId,
                $movementType,
                $dateFrom,
                $dateTo,
            ): void {
                $query->where('status', StockMovement::STATUS_POSTED);

                if ($warehouseId) {
                    $query->where('warehouse_id', $warehouseId);
                }

                if ($movementType) {
                    $query->where('movement_type', $movementType);
                }

                if ($dateFrom) {
                    $query->whereDate('movement_date', '>=', $dateFrom);
                }

                if ($dateTo) {
                    $query->whereDate('movement_date', '<=', $dateTo);
                }
            })
            ->when($variantId, fn (Builder $query) => $query->where('product_variant_id', $variantId))
            ->join('stock_movements as sm', 'sm.id', '=', 'stock_movement_lines.stock_movement_id')
            ->orderByDesc('sm.movement_date')
            ->orderByDesc('stock_movement_lines.id')
            ->select('stock_movement_lines.*')
            ->get();
    }

    /**
     * @return array<string, string>
     */
    public function balancesAfter(string $warehouseId, string $variantId): array
    {
        $lines = StockMovementLine::query()
            ->where('product_variant_id', $variantId)
            ->whereHas('movement', fn (Builder $query) => $query
                ->where('warehouse_id', $warehouseId)
                ->where('status', StockMovement::STATUS_POSTED))
            ->with('movement:id,movement_date')
            ->get()
            ->sortBy([
                fn (StockMovementLine $line) => $line->movement?->movement_date?->timestamp ?? 0,
                fn (StockMovementLine $line) => $line->id,
            ]);

        $running = '0.0000';
        $map = [];

        foreach ($lines as $line) {
            $running = bcadd($running, (string) $line->quantity, 4);
            $map[$line->id] = $running;
        }

        return $map;
    }

    /**
     * @param  Collection<int, StockMovementLine>  $lines
     * @return array{
     *     total_lines: int,
     *     entries: int,
     *     exits: int,
     *     inbound_qty: string,
     *     outbound_qty: string,
     * }
     */
    public function summarize(Collection $lines): array
    {
        $entries = 0;
        $exits = 0;
        $inbound = '0.0000';
        $outbound = '0.0000';

        foreach ($lines as $line) {
            $qty = (string) $line->quantity;

            if (bccomp($qty, '0', 4) === 1) {
                $entries++;
                $inbound = bcadd($inbound, $qty, 4);
            } elseif (bccomp($qty, '0', 4) === -1) {
                $exits++;
                $outbound = bcadd($outbound, ltrim($qty, '-'), 4);
            }
        }

        return [
            'total_lines' => $lines->count(),
            'entries' => $entries,
            'exits' => $exits,
            'inbound_qty' => $inbound,
            'outbound_qty' => $outbound,
        ];
    }

    public function parseDateFilter(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }
}
