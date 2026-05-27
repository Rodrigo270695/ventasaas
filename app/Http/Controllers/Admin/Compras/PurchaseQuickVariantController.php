<?php

namespace App\Http\Controllers\Admin\Compras;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Compras\QuickPurchaseVariantRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Unit;
use App\Support\Catalog\VariantCatalogOptions;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class PurchaseQuickVariantController extends Controller
{
    public function store(QuickPurchaseVariantRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (! empty($data['product_id'])) {
            $product = Product::query()->findOrFail($data['product_id']);
        } else {
            $unitId = Unit::query()->where('is_active', true)->orderBy('code')->value('id');

            if (! $unitId) {
                throw new InvalidArgumentException('No hay unidades de medida activas en el catálogo.');
            }

            $product = Product::query()->create([
                'name' => $data['product_name'],
                'type' => Product::TYPE_GOOD,
                'base_unit_id' => $unitId,
                'track_stock' => $data['track_stock'] ?? true,
                'is_active' => true,
            ]);
        }

        $variant = $product->variants()->create([
            'sku' => $data['sku'],
            'label' => $data['label'] ?? null,
            'barcode' => $data['barcode'] ?? null,
            'is_default' => $product->variants()->count() === 0,
            'is_active' => true,
        ]);

        $options = VariantCatalogOptions::variantOptions();
        $option = collect($options)->firstWhere('value', $variant->id);

        return response()->json([
            'variant' => $option ?? [
                'value' => $variant->id,
                'label' => trim($product->name.' · '.($variant->label ?: $variant->sku)),
                'sublabel' => $variant->sku,
                'unit_price' => '0.00',
                'track_stock' => (bool) $product->track_stock,
                'product_id' => $product->id,
            ],
        ]);
    }
}
