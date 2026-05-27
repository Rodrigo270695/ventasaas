<?php

namespace Database\Factories;

use App\Models\TreasuryCashRegister;
use App\Models\TreasuryCashRegisterSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TreasuryCashRegisterSession>
 */
class TreasuryCashRegisterSessionFactory extends Factory
{
    protected $model = TreasuryCashRegisterSession::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'cash_register_id' => TreasuryCashRegister::factory(),
            'status' => TreasuryCashRegisterSession::STATUS_OPEN,
            'opened_at' => now(),
            'opened_by' => User::factory(),
            'opening_float' => 100,
        ];
    }

    public function closed(): static
    {
        return $this->state(fn () => [
            'status' => TreasuryCashRegisterSession::STATUS_CLOSED,
            'closed_at' => now(),
            'closed_by' => User::factory(),
            'expected_cash' => 100,
            'closing_cash_counted' => 100,
            'cash_difference' => 0,
        ]);
    }
}
