<?php

namespace Database\Factories;

use App\Models\PriceList;
use App\Models\ProductPrice;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductPrice>
 */
class ProductPriceFactory extends Factory
{
    protected $model = ProductPrice::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_variant_id' => ProductVariant::factory(),
            'price_list_id' => PriceList::factory(),
            'amount' => fake()->randomFloat(2, 1, 500),
            'source' => ProductPrice::SOURCE_MANUAL,
        ];
    }
}
