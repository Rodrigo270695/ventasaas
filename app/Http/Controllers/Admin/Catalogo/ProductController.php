<?php

namespace App\Http\Controllers\Admin\Catalogo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalogo\ProductRequest;
use App\Models\Brand;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPrice;
use App\Models\ProductTaxProfile;
use App\Models\ProductVariant;
use App\Models\StockBalance;
use App\Models\TaxProfile;
use App\Models\Unit;
use App\Models\VariantPackagingConversion;
use App\Models\Warehouse;
use App\Support\Toast;
use App\Support\VariantExpiryStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('products.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['productModal', 'errors']);
        }

        $defaultWarehouse = $this->defaultWarehouse();

        $products = Product::query()
            ->with([
                'category:id,name',
                'brand:id,name',
                'baseUnit:id,code,name,symbol',
                'variants' => fn ($query) => $query
                    ->with([
                        'prices.priceList:id,code,name,currency_code',
                        'taxProfile.taxProfile:id,code,name',
                    ])
                    ->orderByDesc('is_default')
                    ->orderBy('sku'),
            ])
            ->withCount('variants')
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'description',
                'type',
                'category_id',
                'brand_id',
                'base_unit_id',
                'track_stock',
                'is_active',
            ]);

        $productsPayload = $products->map(fn (Product $product) => $this->mapProductListRow($product));

        $activeCount = $products->where('is_active', true)->count();
        $goodsCount = $products->where('type', Product::TYPE_GOOD)->count();
        $servicesCount = $products->where('type', Product::TYPE_SERVICE)->count();

        return Inertia::render('admin/catalogo/productos/index', [
            'products' => $productsPayload,
            'warehouseOptions' => $this->warehouseOptions(),
            'defaultWarehouseId' => $defaultWarehouse?->id,
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $products->count(), 'tone' => 'violet'],
                ['key' => 'active', 'label' => 'Activos', 'value' => $activeCount, 'tone' => 'green'],
                ['key' => 'goods', 'label' => 'Bienes', 'value' => $goodsCount, 'tone' => 'cyan'],
                ['key' => 'services', 'label' => 'Servicios', 'value' => $servicesCount, 'tone' => 'amber'],
            ],
            'categoryOptions' => $this->selectOptions(
                ProductCategory::query()->orderBy('name')->get(['id', 'name']),
            ),
            'brandOptions' => $this->selectOptions(
                Brand::query()->orderBy('name')->get(['id', 'name']),
            ),
            'unitOptions' => $this->unitOptions(),
            'productModal' => session()->pull('productModal'),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    public function show(Request $request, Product $producto): Response
    {
        abort_unless($request->user()?->can('products.view'), 403);

        $defaultWarehouse = $this->defaultWarehouse();
        $product = $this->loadProductForDetail($producto, $defaultWarehouse);

        $tab = $request->query('tab', 'general');
        $allowedTabs = ['general', 'variantes', 'precios', 'impuestos', 'stock', 'empaque'];

        if (! in_array($tab, $allowedTabs, true)) {
            $tab = 'general';
        }

        return Inertia::render('admin/catalogo/productos/show', [
            'product' => $this->mapProductDetail($product, $defaultWarehouse),
            'tab' => $tab,
            'categoryOptions' => $this->selectOptions(
                ProductCategory::query()->orderBy('name')->get(['id', 'name']),
            ),
            'brandOptions' => $this->selectOptions(
                Brand::query()->orderBy('name')->get(['id', 'name']),
            ),
            'unitOptions' => $this->unitOptions(),
            'taxProfileOptions' => $this->taxProfileOptions(),
            'warehouseOptions' => $this->warehouseOptions(),
            'defaultWarehouseId' => $defaultWarehouse?->id,
            'defaultWarehouseLabel' => $defaultWarehouse
                ? trim($defaultWarehouse->name.' ('.$defaultWarehouse->code.')')
                : null,
            'priceListOptions' => $this->priceListOptions(),
            'packagingConversions' => $producto->packagingConversions()
                ->with(['fromVariant:id,sku,label', 'toVariant:id,sku,label'])
                ->where('is_active', true)
                ->orderBy('created_at')
                ->get()
                ->map(fn (VariantPackagingConversion $conversion) => [
                    'id' => $conversion->id,
                    'from_variant_id' => $conversion->from_variant_id,
                    'to_variant_id' => $conversion->to_variant_id,
                    'from_sku' => $conversion->fromVariant?->sku,
                    'from_label' => $conversion->fromVariant?->label,
                    'to_sku' => $conversion->toVariant?->sku,
                    'to_label' => $conversion->toVariant?->label,
                    'factor' => (string) $conversion->factor,
                    'label' => $conversion->label,
                ])
                ->values()
                ->all(),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $initialVariant = $validated['initial_variant'];
        unset($validated['initial_variant']);

        $product = DB::transaction(function () use ($validated, $initialVariant): Product {
            $product = Product::create($validated);

            $product->variants()->create([
                'sku' => $initialVariant['sku'],
                'label' => $initialVariant['label'] ?? 'Estándar',
                'barcode' => $initialVariant['barcode'] ?? null,
                'is_default' => true,
                'is_active' => true,
            ]);

            return $product;
        });

        Toast::success('Producto creado correctamente.');

        return to_route('admin.catalogo.productos.show', [
            'producto' => $product,
            'tab' => 'variantes',
        ]);
    }

    public function update(ProductRequest $request, Product $producto): RedirectResponse
    {
        $validated = $request->validated();
        unset($validated['initial_variant']);

        $producto->update($validated);

        Toast::success('Producto actualizado.');

        return to_route('admin.catalogo.productos.show', [
            'producto' => $producto,
            'tab' => 'general',
        ]);
    }

    public function stockSummary(Request $request, Product $producto): JsonResponse
    {
        abort_unless(
            $request->user()?->can('stock_balances.view')
            || $request->user()?->can('products.view'),
            403,
        );

        $warehouseId = $request->string('warehouse_id')->toString() ?: null;
        $defaultWarehouse = $this->defaultWarehouse();

        if (! $warehouseId && $defaultWarehouse) {
            $warehouseId = $defaultWarehouse->id;
        }

        $warehouse = $warehouseId
            ? Warehouse::query()
                ->where('is_active', true)
                ->find($warehouseId, ['id', 'code', 'name'])
            : null;

        if (! $producto->track_stock || $producto->type !== Product::TYPE_GOOD) {
            return response()->json([
                'product_id' => $producto->id,
                'product_name' => $producto->name,
                'track_stock' => $producto->track_stock,
                'warehouse_id' => $warehouse?->id,
                'warehouse_label' => $warehouse
                    ? trim($warehouse->name.' ('.$warehouse->code.')')
                    : null,
                'variants' => [],
            ]);
        }

        $variants = $producto->variants()
            ->where('is_active', true)
            ->with([
                'stockBalances' => fn ($query) => $query->when(
                    $warehouseId,
                    fn ($balanceQuery) => $balanceQuery->where('warehouse_id', $warehouseId),
                ),
            ])
            ->orderByDesc('is_default')
            ->orderBy('sku')
            ->get(['id', 'sku', 'label', 'minimum_stock', 'expires_at', 'expiry_alert_days', 'is_default']);

        $rows = $variants->map(function (ProductVariant $variant) {
            $balance = $variant->stockBalances->first();
            $qty = (string) ($balance?->quantity_on_hand ?? '0');
            $avg = (string) ($balance?->avg_cost ?? '0');
            $value = bcmul($qty, $avg, 2);
            $minimumStock = number_format((float) $variant->minimum_stock, 2, '.', '');
            $isOutOfStock = bccomp($qty, '0', 4) <= 0;
            $isLowStock = ! $isOutOfStock
                && bccomp($minimumStock, '0', 4) === 1
                && bccomp($qty, $minimumStock, 4) <= 0;

            return [
                'variant_id' => $variant->id,
                'sku' => $variant->sku,
                'label' => $variant->label,
                'is_default' => $variant->is_default,
                'minimum_stock' => $minimumStock,
                'quantity_on_hand' => $qty,
                'avg_cost' => $avg,
                'stock_value' => $value,
                'is_low_stock' => $isLowStock,
                'is_out_of_stock' => $isOutOfStock,
                ...VariantExpiryStatus::toPayload($variant->expires_at, $variant->expiry_alert_days),
            ];
        });

        return response()->json([
            'product_id' => $producto->id,
            'product_name' => $producto->name,
            'track_stock' => $producto->track_stock,
            'warehouse_id' => $warehouse?->id,
            'warehouse_label' => $warehouse
                ? trim($warehouse->name.' ('.$warehouse->code.')')
                : null,
            'variants' => $rows->values()->all(),
        ]);
    }

    public function destroy(Request $request, Product $producto): RedirectResponse
    {
        abort_unless($request->user()?->can('products.delete'), 403);

        $producto->delete();

        Toast::success('Producto eliminado.');

        return to_route('admin.catalogo.productos.index');
    }

    private function defaultWarehouse(): ?Warehouse
    {
        return Warehouse::query()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('sort_order')
            ->first(['id', 'code', 'name']);
    }

    private function loadProductForDetail(Product $product, ?Warehouse $defaultWarehouse): Product
    {
        return $product->load([
            'category:id,name',
            'brand:id,name',
            'baseUnit:id,code,name,symbol',
            'variants' => fn ($query) => $query
                ->with([
                    'prices.priceList:id,code,name,currency_code',
                    'taxProfile.taxProfile:id,code,name',
                    'stockBalances' => fn ($balanceQuery) => $balanceQuery
                        ->when(
                            $defaultWarehouse,
                            fn ($q) => $q->where('warehouse_id', $defaultWarehouse->id),
                        ),
                ])
                ->orderByDesc('is_default')
                ->orderBy('sku'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapProductListRow(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'type' => $product->type,
            'category_id' => $product->category_id,
            'category_name' => $product->category?->name,
            'brand_id' => $product->brand_id,
            'brand_name' => $product->brand?->name,
            'base_unit_id' => $product->base_unit_id,
            'base_unit_label' => $product->baseUnit
                ? trim($product->baseUnit->name.' ('.$product->baseUnit->code.')')
                : null,
            'track_stock' => $product->track_stock,
            'is_active' => $product->is_active,
            'variants_count' => $product->variants_count,
            'default_sku' => $this->defaultSku($product),
            'default_barcode' => $this->defaultBarcode($product),
            'default_price' => $this->defaultPrice($product),
            'default_tax_label' => $this->defaultTaxLabel($product),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapProductDetail(Product $product, ?Warehouse $defaultWarehouse): array
    {
        return [
            ...$this->mapProductListRow($product),
            'variants' => $product->variants->map(fn (ProductVariant $variant) => [
                'id' => $variant->id,
                'sku' => $variant->sku,
                'label' => $variant->label,
                'barcode' => $variant->barcode,
                'minimum_stock' => number_format((float) $variant->minimum_stock, 2, '.', ''),
                ...VariantExpiryStatus::toPayload($variant->expires_at, $variant->expiry_alert_days),
                'is_default' => $variant->is_default,
                'is_active' => $variant->is_active,
                'prices' => $variant->prices->map(fn (ProductPrice $price) => [
                    'id' => $price->id,
                    'price_list_id' => $price->price_list_id,
                    'price_list_code' => $price->priceList?->code,
                    'price_list_name' => $price->priceList?->name,
                    'currency_code' => $price->priceList?->currency_code ?? 'PEN',
                    'amount' => (string) $price->amount,
                ])->values()->all(),
                'tax_profile' => $this->mapVariantTaxProfile($variant->taxProfile),
                'stock' => $this->mapVariantStock($variant->stockBalances->first()),
            ])->values()->all(),
        ];
    }

    private function defaultSku(Product $product): ?string
    {
        return $this->defaultVariant($product)?->sku;
    }

    private function defaultBarcode(Product $product): ?string
    {
        return $this->defaultVariant($product)?->barcode;
    }

    private function defaultTaxLabel(Product $product): ?string
    {
        $assignment = $this->defaultVariant($product)?->taxProfile;

        if (! $assignment) {
            return null;
        }

        $code = $assignment->taxProfile?->code ?? $assignment->sunat_affectation_code;

        return trim($code.' · IGV '.(string) $assignment->igv_rate.'%');
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapVariantTaxProfile(?ProductTaxProfile $assignment): ?array
    {
        if (! $assignment) {
            return null;
        }

        return [
            'id' => $assignment->id,
            'tax_profile_id' => $assignment->tax_profile_id,
            'tax_profile_code' => $assignment->taxProfile?->code,
            'tax_profile_name' => $assignment->taxProfile?->name,
            'sunat_affectation_code' => $assignment->sunat_affectation_code,
            'igv_rate' => (string) $assignment->igv_rate,
            'isc_rate' => $assignment->isc_rate !== null ? (string) $assignment->isc_rate : null,
        ];
    }

    /**
     * @return array<string, string>|null
     */
    private function mapVariantStock(?StockBalance $balance): ?array
    {
        if (! $balance) {
            return null;
        }

        return [
            'warehouse_id' => $balance->warehouse_id,
            'quantity_on_hand' => (string) $balance->quantity_on_hand,
            'avg_cost' => (string) $balance->avg_cost,
        ];
    }

    private function defaultPrice(Product $product): ?string
    {
        $variant = $this->defaultVariant($product);

        if (! $variant) {
            return null;
        }

        $defaultListId = PriceList::query()
            ->where('is_default', true)
            ->value('id');

        $price = $variant->prices->firstWhere('price_list_id', $defaultListId)
            ?? $variant->prices->first();

        return $price ? (string) $price->amount : null;
    }

    private function defaultVariant(Product $product): ?ProductVariant
    {
        return $product->variants->firstWhere('is_default', true)
            ?? $product->variants->first();
    }

    /**
     * @return list<array{value: string, label: string, code: string, sunat_affectation_code: string, igv_rate: string, isc_rate: string, is_default: bool}>
     */
    private function taxProfileOptions(): array
    {
        return TaxProfile::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'sunat_affectation_code', 'igv_rate', 'isc_rate', 'is_default'])
            ->map(fn (TaxProfile $profile) => [
                'value' => $profile->id,
                'label' => trim($profile->name.' ('.$profile->code.')'),
                'code' => $profile->code,
                'sunat_affectation_code' => $profile->sunat_affectation_code,
                'igv_rate' => (string) $profile->igv_rate,
                'isc_rate' => $profile->isc_rate !== null ? (string) $profile->isc_rate : '',
                'is_default' => $profile->is_default,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{value: string, label: string, code: string, is_default: bool}>
     */
    private function warehouseOptions(): array
    {
        return Warehouse::query()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'is_default'])
            ->map(fn (Warehouse $warehouse) => [
                'value' => $warehouse->id,
                'label' => trim($warehouse->name.' ('.$warehouse->code.')'),
                'code' => $warehouse->code,
                'is_default' => $warehouse->is_default,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{value: string, label: string, code: string, currency_code: string, is_default: bool}>
     */
    private function priceListOptions(): array
    {
        return PriceList::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'currency_code', 'is_default'])
            ->map(fn (PriceList $list) => [
                'value' => $list->id,
                'label' => trim($list->name.' ('.$list->code.')'),
                'code' => $list->code,
                'currency_code' => $list->currency_code,
                'is_default' => $list->is_default,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function unitOptions(): array
    {
        return Unit::query()
            ->orderBy('name')
            ->get(['id', 'code', 'name'])
            ->map(fn (Unit $unit) => [
                'value' => $unit->id,
                'label' => trim($unit->name.' ('.$unit->code.')'),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  iterable<int, object{id: string, name: string}>  $rows
     * @return list<array{value: string, label: string}>
     */
    private function selectOptions(iterable $rows): array
    {
        $options = [];

        foreach ($rows as $row) {
            $options[] = [
                'value' => $row->id,
                'label' => $row->name,
            ];
        }

        return $options;
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        $initial = old('initial_variant', []);

        return [
            'name' => old('name', ''),
            'description' => old('description', ''),
            'type' => old('type', Product::TYPE_GOOD),
            'category_id' => old('category_id', ''),
            'brand_id' => old('brand_id', ''),
            'base_unit_id' => old('base_unit_id', ''),
            'track_stock' => filter_var(old('track_stock', true), FILTER_VALIDATE_BOOLEAN),
            'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
            'initial_variant' => [
                'sku' => is_array($initial) ? ($initial['sku'] ?? '') : '',
                'label' => is_array($initial) ? ($initial['label'] ?? '') : '',
                'barcode' => is_array($initial) ? ($initial['barcode'] ?? '') : '',
            ],
        ];
    }
}
