<?php

namespace App\Support\Catalog;

use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockBalance;
use App\Models\Warehouse;

class VariantCatalogOptions
{
    /**
     * @return list<array{value: string, label: string, sublabel?: string, searchText?: string, unit_price?: string, track_stock?: bool}>
     */
    public static function variantOptions(): array
    {
        $defaultListId = PriceList::query()->where('is_default', true)->value('id');

        return Product::query()
            ->where('is_active', true)
            ->with([
                'variants' => fn ($query) => $query
                    ->where('is_active', true)
                    ->orderByDesc('is_default')
                    ->orderBy('sku')
                    ->with(['prices', 'taxProfile']),
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'track_stock', 'type'])
            ->flatMap(function (Product $product) use ($defaultListId) {
                return $product->variants->map(function (ProductVariant $variant) use ($product, $defaultListId) {
                    $price = $variant->prices->firstWhere('price_list_id', $defaultListId)
                        ?? $variant->prices->first();

                    return [
                        'value' => $variant->id,
                        'label' => trim($product->name.' · '.($variant->label ?: $variant->sku)),
                        'sublabel' => $variant->sku,
                        'barcode' => $variant->barcode,
                        'searchText' => strtolower(implode(' ', array_filter([
                            $product->name,
                            $variant->sku,
                            $variant->label,
                            $variant->barcode,
                        ]))),
                        'unit_price' => $price
                            ? self::formatDecimal($price->amount)
                            : '0.00',
                        'track_stock' => (bool) $product->track_stock,
                        'product_id' => $product->id,
                    ];
                });
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function warehouseOptions(): array
    {
        return Warehouse::query()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'is_default'])
            ->map(fn (Warehouse $w) => [
                'value' => $w->id,
                'label' => "{$w->name} ({$w->code})",
            ])
            ->all();
    }

    /**
     * @param  list<string>  $warehouseIds
     * @return array<string, array<string, string>>
     */
    public static function stockByWarehouse(array $warehouseIds): array
    {
        if ($warehouseIds === []) {
            return [];
        }

        $result = array_fill_keys($warehouseIds, []);

        StockBalance::query()
            ->whereIn('warehouse_id', $warehouseIds)
            ->get(['warehouse_id', 'product_variant_id', 'quantity_on_hand'])
            ->each(function (StockBalance $balance) use (&$result) {
                $result[$balance->warehouse_id][$balance->product_variant_id] = self::formatDecimal(
                    $balance->quantity_on_hand,
                );
            });

        return $result;
    }

    public static function defaultWarehouseId(): ?string
    {
        return Warehouse::query()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->value('id');
    }

    private static function formatDecimal(mixed $value): string
    {
        return number_format((float) $value, 2, '.', '');
    }
}
