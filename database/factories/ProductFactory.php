<?php

namespace Database\Factories;

use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductVariant;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->sentence(),
            'type' => Product::TYPE_GOOD,
            'category_id' => ProductCategory::factory(),
            'brand_id' => Brand::factory(),
            'base_unit_id' => Unit::factory(),
            'track_stock' => true,
            'is_active' => true,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Product $product): void {
            ProductVariant::factory()->create([
                'product_id' => $product->id,
                'sku' => strtoupper(fake()->unique()->bothify('SKU-####')),
                'label' => 'Estándar',
                'is_default' => true,
            ]);
        });
    }

    public function service(): static
    {
        return $this->state(fn () => [
            'type' => Product::TYPE_SERVICE,
            'track_stock' => false,
        ]);
    }
}
