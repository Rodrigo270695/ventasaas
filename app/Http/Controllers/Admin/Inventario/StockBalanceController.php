<?php

namespace App\Http\Controllers\Admin\Inventario;

use App\Http\Controllers\Controller;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\StockBalance;
use App\Models\VariantPackagingConversion;
use App\Models\Warehouse;
use App\Services\Catalog\ProductPriceFromCostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockBalanceController extends Controller
{
    public function __construct(
        private readonly ProductPriceFromCostService $productPriceFromCostService,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('stock_balances.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget([
                'stockAdjustModal',
                'stockAdjustVariantId',
                'stockAdjustWarehouseId',
                'errors',
            ]);
        }

        $warehouseId = $request->string('warehouse_id')->toString() ?: null;

        $warehouses = Warehouse::query()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'is_default']);

        if (! $warehouseId && $warehouses->isNotEmpty()) {
            $warehouseId = $warehouses->firstWhere('is_default', true)?->id
                ?? $warehouses->first()->id;
        }

        $balancesQuery = StockBalance::query()
            ->with([
                'variant:id,product_id,sku,label,minimum_stock',
                'variant.product:id,name,track_stock,type',
                'warehouse:id,code,name',
            ])
            ->when(
                $warehouseId,
                fn ($query) => $query->where('warehouse_id', $warehouseId),
            );

        $balances = $balancesQuery
            ->orderByDesc('quantity_on_hand')
            ->get();

        $trackStockVariants = Product::query()
            ->where('track_stock', true)
            ->where('type', Product::TYPE_GOOD)
            ->with(['variants' => fn ($query) => $query
                ->where('is_active', true)
                ->orderByDesc('is_default')
                ->orderBy('sku')
                ->select(['id', 'product_id', 'sku', 'label', 'is_default']),
            ])
            ->orderBy('name')
            ->get(['id', 'name']);

        $variantOptions = $trackStockVariants->flatMap(function (Product $product) {
            return $product->variants->map(function ($variant) use ($product) {
                $label = trim($product->name.' · '.($variant->label ?: $variant->sku));

                return [
                    'value' => $variant->id,
                    'label' => $label,
                    'sublabel' => $variant->sku,
                    'searchText' => strtolower(implode(' ', array_filter([
                        $product->name,
                        $variant->sku,
                        $variant->label,
                    ]))),
                ];
            });
        })->values()->all();

        $rows = $balances->map(function (StockBalance $balance) {
            $qty = (string) $balance->quantity_on_hand;
            $avg = (string) $balance->avg_cost;
            $value = bcmul($qty, $avg, 2);
            $minimumStock = (string) ($balance->variant?->minimum_stock ?? '0');
            $isOutOfStock = bccomp($qty, '0', 4) <= 0;
            $isLowStock = ! $isOutOfStock && bccomp($minimumStock, '0', 4) === 1 && bccomp($qty, $minimumStock, 4) <= 0;

            return [
                'id' => $balance->id,
                'warehouse_id' => $balance->warehouse_id,
                'warehouse_code' => $balance->warehouse?->code,
                'warehouse_name' => $balance->warehouse?->name,
                'product_variant_id' => $balance->product_variant_id,
                'product_name' => $balance->variant?->product?->name,
                'variant_sku' => $balance->variant?->sku,
                'variant_label' => $balance->variant?->label,
                'minimum_stock' => $minimumStock,
                'quantity_on_hand' => $qty,
                'quantity_reserved' => (string) $balance->quantity_reserved,
                'avg_cost' => $avg,
                'stock_value' => $value,
                'is_low_stock' => $isLowStock,
                'is_out_of_stock' => $isOutOfStock,
            ];
        });

        $withStock = $rows->filter(fn (array $row) => (float) $row['quantity_on_hand'] > 0)->count();
        $lowStock = $rows->filter(fn (array $row) => $row['is_low_stock'] || $row['is_out_of_stock'])->count();
        $totalValue = $rows->reduce(
            fn (string $carry, array $row) => bcadd($carry, $row['stock_value'], 2),
            '0',
        );

        return Inertia::render('admin/inventario/saldos/index', [
            'balances' => $rows->values()->all(),
            'warehouseOptions' => $warehouses->map(fn (Warehouse $warehouse) => [
                'value' => $warehouse->id,
                'label' => trim($warehouse->name.' ('.$warehouse->code.')'),
                'is_default' => $warehouse->is_default,
            ])->values()->all(),
            'selectedWarehouseId' => $warehouseId,
            'variantOptions' => $variantOptions,
            'priceListOptions' => $this->productPriceFromCostService->priceListOptions(
                PriceList::query()
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->orderBy('name')
                    ->get(['id', 'code', 'name', 'currency_code', 'is_default']),
            ),
            'packagingConversions' => VariantPackagingConversion::query()
                ->where('is_active', true)
                ->with([
                    'fromVariant:id,sku,label,product_id',
                    'toVariant:id,sku,label,product_id',
                    'product:id,name',
                ])
                ->orderBy('created_at')
                ->get()
                ->map(fn (VariantPackagingConversion $conversion) => [
                    'id' => $conversion->id,
                    'product_id' => $conversion->product_id,
                    'product_name' => $conversion->product?->name,
                    'from_variant_id' => $conversion->from_variant_id,
                    'to_variant_id' => $conversion->to_variant_id,
                    'from_sku' => $conversion->fromVariant?->sku,
                    'to_sku' => $conversion->toVariant?->sku,
                    'factor' => (string) $conversion->factor,
                    'label' => $conversion->label,
                ])
                ->values()
                ->all(),
            'stats' => [
                ['key' => 'skus', 'label' => 'Registros', 'value' => $rows->count(), 'tone' => 'violet'],
                ['key' => 'with_stock', 'label' => 'Con stock', 'value' => $withStock, 'tone' => 'green'],
                [
                    'key' => 'zero',
                    'label' => 'Sin stock',
                    'value' => $rows->count() - $withStock,
                    'tone' => 'amber',
                ],
                [
                    'key' => 'low',
                    'label' => 'Bajo mínimo',
                    'value' => $lowStock,
                    'tone' => 'pink',
                ],
                [
                    'key' => 'value',
                    'label' => 'Valor (S/)',
                    'value' => number_format((float) $totalValue, 2, '.', ''),
                    'tone' => 'cyan',
                ],
            ],
            'stockAdjustModal' => session()->pull('stockAdjustModal'),
            'stockAdjustVariantId' => session()->pull('stockAdjustVariantId')
                ?? ($request->string('adjust_variant')->toString() ?: null),
            'stockAdjustWarehouseId' => session()->pull('stockAdjustWarehouseId'),
            'openAdjustOnLoad' => $request->filled('adjust_variant'),
            'oldForm' => [
                'product_variant_id' => old('product_variant_id', ''),
                'quantity_on_hand' => old('quantity_on_hand', ''),
                'unit_cost' => old('unit_cost', ''),
                'notes' => old('notes', ''),
                'sync_sale_prices' => filter_var(
                    old('sync_sale_prices', false),
                    FILTER_VALIDATE_BOOLEAN,
                ),
                'price_list_ids' => old('price_list_ids', []),
                'markup_type' => old('markup_type', 'percent'),
                'markup_value' => old('markup_value', ''),
            ],
        ]);
    }

    public function lookup(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('stock_balances.view'), 403);

        $validated = $request->validate([
            'warehouse_id' => ['required', 'uuid', 'exists:warehouses,id'],
            'product_variant_id' => ['required', 'uuid', 'exists:product_variants,id'],
        ]);

        $balance = StockBalance::query()
            ->where('warehouse_id', $validated['warehouse_id'])
            ->where('product_variant_id', $validated['product_variant_id'])
            ->first(['quantity_on_hand', 'avg_cost']);

        return response()->json([
            'quantity_on_hand' => (string) ($balance?->quantity_on_hand ?? '0'),
            'avg_cost' => (string) ($balance?->avg_cost ?? '0'),
        ]);
    }
}
