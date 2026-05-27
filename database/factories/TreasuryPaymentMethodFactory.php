<?php

namespace Database\Factories;

use App\Models\TreasuryPaymentMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TreasuryPaymentMethod>
 */
class TreasuryPaymentMethodFactory extends Factory
{
    protected $model = TreasuryPaymentMethod::class;

    public function definition(): array
    {
        $code = fake()->unique()->lexify('pm_????');

        return [
            'code' => $code,
            'name' => fake()->words(2, true),
            'type' => TreasuryPaymentMethod::TYPE_CASH,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
