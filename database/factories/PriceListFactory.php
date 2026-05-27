<?php

namespace Database\Factories;

use App\Models\PriceList;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PriceList>
 */
class PriceListFactory extends Factory
{
    protected $model = PriceList::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $code = strtoupper(fake()->unique()->lexify('???'));

        return [
            'code' => $code,
            'name' => fake()->words(2, true),
            'currency_code' => 'PEN',
            'is_default' => false,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function defaultList(): static
    {
        return $this->state(fn () => [
            'is_default' => true,
        ]);
    }
}
