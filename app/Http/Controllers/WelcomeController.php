<?php

namespace App\Http\Controllers;

use App\Models\CfgStoreSetting;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $store = CfgStoreSetting::query()->first();
        $defaultPriceListId = PriceList::query()
            ->where('is_active', true)
            ->where('is_default', true)
            ->value('id');

        $products = Product::query()
            ->where('is_active', true)
            ->with([
                'category:id,name',
                'brand:id,name',
                'variants' => fn ($query) => $query
                    ->where('is_active', true)
                    ->with([
                        'prices' => fn ($priceQuery) => $priceQuery
                            ->when(
                                $defaultPriceListId,
                                fn ($q) => $q->where('price_list_id', $defaultPriceListId),
                            )
                            ->with('priceList:id,currency_code'),
                    ])
                    ->orderByDesc('is_default')
                    ->orderBy('sku'),
            ])
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'description',
                'type',
                'category_id',
                'brand_id',
            ]);

        $catalogProducts = $products
            ->map(fn (Product $product) => $this->mapCatalogProduct($product))
            ->filter(fn (array $product) => $product['variants'] !== [])
            ->values();

        $categoryIds = $catalogProducts
            ->pluck('category_id')
            ->filter()
            ->unique()
            ->values();

        $categories = ProductCategory::query()
            ->whereIn('id', $categoryIds)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (ProductCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
            ])
            ->values()
            ->all();

        return Inertia::render('welcome', [
            'store' => [
                'name' => $store?->razon_social,
                'whatsapp_number' => $this->normalizeWhatsappNumber($store?->whatsapp_number),
            ],
            'categories' => $categories,
            'products' => $catalogProducts->values()->all(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapCatalogProduct(Product $product): array
    {
        $variants = $product->variants
            ->map(function (ProductVariant $variant) {
                $price = $variant->prices->first();

                if (! $price) {
                    return null;
                }

                return [
                    'id' => $variant->id,
                    'sku' => $variant->sku,
                    'label' => $variant->label,
                    'is_default' => $variant->is_default,
                    'price' => (string) $price->amount,
                    'currency_code' => $price->priceList?->currency_code ?? 'PEN',
                ];
            })
            ->filter()
            ->values()
            ->all();

        return [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'type' => $product->type,
            'category_id' => $product->category_id,
            'category_name' => $product->category?->name,
            'brand_name' => $product->brand?->name,
            'variants' => $variants,
        ];
    }

    private function normalizeWhatsappNumber(?string $number): ?string
    {
        if (blank($number)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $number) ?? '';

        if ($digits === '') {
            return null;
        }

        if (strlen($digits) === 9) {
            return '51'.$digits;
        }

        return $digits;
    }
}
