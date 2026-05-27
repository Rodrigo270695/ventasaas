<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPrice;
use App\Models\ProductTaxProfile;
use App\Models\ProductVariant;
use App\Models\TaxProfile;
use App\Models\Unit;
use App\Models\VariantPackagingConversion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CatalogDemoSeeder extends Seeder
{
    public function run(): void
    {
        $unitId = Unit::query()->where('code', 'NIU')->value('id');

        if (! $unitId) {
            $this->command?->warn('CatalogDemoSeeder: ejecuta UnitSeeder antes.');

            return;
        }

        $priceListId = PriceList::query()->where('code', 'RETAIL')->value('id');
        $taxProfileId = TaxProfile::query()->where('code', 'GRAVADO-18')->value('id');

        $categories = $this->seedCategories();
        $brands = $this->seedBrands();

        $this->seedCatalog($unitId, $categories, $brands, $priceListId, $taxProfileId);
    }

    /**
     * @return array<string, ProductCategory>
     */
    private function seedCategories(): array
    {
        $rows = [
            ['code' => 'BEBIDAS', 'name' => 'Bebidas'],
            ['code' => 'SNACKS', 'name' => 'Snacks y golosinas'],
            ['code' => 'LACTEOS', 'name' => 'Lácteos'],
            ['code' => 'ABARROTES', 'name' => 'Abarrotes'],
        ];

        $categories = [];

        foreach ($rows as $row) {
            $categories[$row['code']] = ProductCategory::query()->updateOrCreate(
                ['code' => $row['code']],
                ['name' => $row['name'], 'is_active' => true],
            );
        }

        return $categories;
    }

    /**
     * @return array<string, Brand>
     */
    private function seedBrands(): array
    {
        $rows = [
            ['code' => 'GLORIA', 'name' => 'Gloria'],
            ['code' => 'ARCOR', 'name' => 'Arcor'],
            ['code' => 'LAIVE', 'name' => 'Laive'],
            ['code' => 'PROPIO', 'name' => 'Marca propia'],
        ];

        $brands = [];

        foreach ($rows as $row) {
            $brands[$row['code']] = Brand::query()->updateOrCreate(
                ['code' => $row['code']],
                ['name' => $row['name'], 'is_active' => true],
            );
        }

        return $brands;
    }

    /**
     * @param  array<string, ProductCategory>  $categories
     * @param  array<string, Brand>  $brands
     */
    private function seedCatalog(
        string $unitId,
        array $categories,
        array $brands,
        ?string $priceListId,
        ?string $taxProfileId,
    ): void {
        $catalog = [
            [
                'name' => 'Choco Soda',
                'description' => 'Gaseosa sabor chocolate.',
                'category' => 'BEBIDAS',
                'brand' => 'PROPIO',
                'variants' => [
                    ['sku' => 'CHOCO-SODA-PQ6', 'label' => 'Paquete de 6', 'is_default' => false, 'price' => 18.00],
                    ['sku' => 'CHOCO-SODA-UN', 'label' => 'Unidad', 'is_default' => true, 'price' => 3.50],
                ],
                'conversions' => [
                    ['from' => 'CHOCO-SODA-PQ6', 'to' => 'CHOCO-SODA-UN', 'factor' => 6, 'label' => '1 paquete → 6 unidades'],
                ],
            ],
            [
                'name' => 'Gaseosa cola 500 ml',
                'description' => 'Bebida gaseosa personal 500 ml.',
                'category' => 'BEBIDAS',
                'brand' => 'PROPIO',
                'variants' => [
                    ['sku' => 'COLA-500-CAJ24', 'label' => 'Caja x 24', 'is_default' => false, 'price' => 48.00],
                    ['sku' => 'COLA-500-UN', 'label' => 'Unidad', 'is_default' => true, 'price' => 2.50],
                ],
                'conversions' => [
                    ['from' => 'COLA-500-CAJ24', 'to' => 'COLA-500-UN', 'factor' => 24, 'label' => '1 caja → 24 unidades'],
                ],
            ],
            [
                'name' => 'Galletas rellenas vainilla',
                'description' => 'Galletas rellenas sabor vainilla.',
                'category' => 'SNACKS',
                'brand' => 'ARCOR',
                'variants' => [
                    ['sku' => 'GALLET-VAIN-CAJ12', 'label' => 'Caja x 12', 'is_default' => false, 'price' => 14.40],
                    ['sku' => 'GALLET-VAIN-UN', 'label' => 'Unidad', 'is_default' => true, 'price' => 1.50],
                ],
                'conversions' => [
                    ['from' => 'GALLET-VAIN-CAJ12', 'to' => 'GALLET-VAIN-UN', 'factor' => 12, 'label' => '1 caja → 12 unidades'],
                ],
            ],
            [
                'name' => 'Leche evaporada',
                'description' => 'Lata 400 g.',
                'category' => 'LACTEOS',
                'brand' => 'GLORIA',
                'variants' => [
                    ['sku' => 'LECHE-EVAP-CAJ48', 'label' => 'Caja x 48 latas', 'is_default' => false, 'price' => 192.00],
                    ['sku' => 'LECHE-EVAP-400', 'label' => 'Unidad (lata)', 'is_default' => true, 'price' => 4.50],
                ],
                'conversions' => [
                    ['from' => 'LECHE-EVAP-CAJ48', 'to' => 'LECHE-EVAP-400', 'factor' => 48, 'label' => '1 caja → 48 latas'],
                ],
            ],
            [
                'name' => 'Yogurt bebible fresa',
                'description' => 'Botella 1 L.',
                'category' => 'LACTEOS',
                'brand' => 'LAIVE',
                'variants' => [
                    ['sku' => 'YOGURT-FRESA-CAJ6', 'label' => 'Caja x 6', 'is_default' => false, 'price' => 36.00],
                    ['sku' => 'YOGURT-FRESA-1L', 'label' => 'Unidad', 'is_default' => true, 'price' => 6.50],
                ],
                'conversions' => [
                    ['from' => 'YOGURT-FRESA-CAJ6', 'to' => 'YOGURT-FRESA-1L', 'factor' => 6, 'label' => '1 caja → 6 botellas'],
                ],
            ],
            [
                'name' => 'Arroz extra graneado',
                'description' => 'Bolsa 1 kg.',
                'category' => 'ABARROTES',
                'brand' => 'PROPIO',
                'variants' => [
                    ['sku' => 'ARROZ-CAJ10', 'label' => 'Caja x 10 bolsas', 'is_default' => false, 'price' => 38.00],
                    ['sku' => 'ARROZ-1KG', 'label' => 'Unidad (1 kg)', 'is_default' => true, 'price' => 4.20],
                ],
                'conversions' => [
                    ['from' => 'ARROZ-CAJ10', 'to' => 'ARROZ-1KG', 'factor' => 10, 'label' => '1 caja → 10 bolsas'],
                ],
            ],
        ];

        foreach ($catalog as $row) {
            DB::transaction(function () use (
                $row,
                $unitId,
                $categories,
                $brands,
                $priceListId,
                $taxProfileId,
            ): void {
                $product = Product::query()->firstOrCreate(
                    ['name' => $row['name']],
                    [
                        'description' => $row['description'],
                        'type' => Product::TYPE_GOOD,
                        'category_id' => $categories[$row['category']]->id,
                        'brand_id' => $brands[$row['brand']]->id,
                        'base_unit_id' => $unitId,
                        'track_stock' => true,
                        'is_active' => true,
                    ],
                );

                $product->update([
                    'description' => $row['description'],
                    'category_id' => $categories[$row['category']]->id,
                    'brand_id' => $brands[$row['brand']]->id,
                    'track_stock' => true,
                    'is_active' => true,
                ]);

                $variantIds = [];

                foreach ($row['variants'] as $variantRow) {
                    $variant = ProductVariant::query()->updateOrCreate(
                        ['sku' => $variantRow['sku']],
                        [
                            'product_id' => $product->id,
                            'label' => $variantRow['label'],
                            'is_default' => $variantRow['is_default'],
                            'is_active' => true,
                        ],
                    );

                    $variantIds[$variantRow['sku']] = $variant->id;

                    if ($priceListId && isset($variantRow['price'])) {
                        ProductPrice::query()->updateOrCreate(
                            [
                                'product_variant_id' => $variant->id,
                                'price_list_id' => $priceListId,
                            ],
                            [
                                'amount' => $variantRow['price'],
                                'source' => ProductPrice::SOURCE_MANUAL,
                            ],
                        );
                    }

                    if ($taxProfileId) {
                        ProductTaxProfile::query()->updateOrCreate(
                            ['product_variant_id' => $variant->id],
                            [
                                'tax_profile_id' => $taxProfileId,
                                'sunat_affectation_code' => '10',
                                'igv_rate' => 18,
                            ],
                        );
                    }
                }

                $defaultSku = collect($row['variants'])->firstWhere('is_default', true)['sku']
                    ?? $row['variants'][0]['sku'];

                $product->variants()->update(['is_default' => false]);
                $product->variants()->where('sku', $defaultSku)->update(['is_default' => true]);

                foreach ($row['conversions'] ?? [] as $conversion) {
                    $fromId = $variantIds[$conversion['from']] ?? ProductVariant::query()
                        ->where('sku', $conversion['from'])->value('id');
                    $toId = $variantIds[$conversion['to']] ?? ProductVariant::query()
                        ->where('sku', $conversion['to'])->value('id');

                    if (! $fromId || ! $toId) {
                        continue;
                    }

                    VariantPackagingConversion::query()->updateOrCreate(
                        [
                            'from_variant_id' => $fromId,
                            'to_variant_id' => $toId,
                        ],
                        [
                            'product_id' => $product->id,
                            'factor' => $conversion['factor'],
                            'label' => $conversion['label'] ?? null,
                            'is_active' => true,
                        ],
                    );
                }
            });
        }
    }
}
