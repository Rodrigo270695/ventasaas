<?php

namespace Database\Factories;

use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Warehouse>
 */
class WarehouseFactory extends Factory
{
    protected $model = Warehouse::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $code = strtoupper(fake()->unique()->lexify('???'));

        return [
            'code' => $code,
            'name' => 'Almacén '.fake()->city(),
            'is_default' => false,
            'is_saleable' => true,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function defaultWarehouse(): static
    {
        return $this->state(fn () => [
            'code' => 'MAIN',
            'name' => 'Almacén principal',
            'is_default' => true,
        ]);
    }
}
