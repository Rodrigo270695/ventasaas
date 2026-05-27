<?php

namespace Database\Factories;

use App\Models\TreasuryCashRegister;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TreasuryCashRegister>
 */
class TreasuryCashRegisterFactory extends Factory
{
    protected $model = TreasuryCashRegister::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->lexify('CJ??')),
            'name' => 'Caja '.fake()->word(),
            'warehouse_id' => null,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
