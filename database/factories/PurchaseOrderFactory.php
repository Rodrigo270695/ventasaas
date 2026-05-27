<?php

namespace Database\Factories;

use App\Models\Party;
use App\Models\PurchaseOrder;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseOrder>
 */
class PurchaseOrderFactory extends Factory
{
    protected $model = PurchaseOrder::class;

    public function definition(): array
    {
        return [
            'supplier_party_id' => Party::factory()->supplier(),
            'internal_number' => 'OC-'.now()->format('Y').'-000001',
            'order_date' => now()->toDateString(),
            'expected_date' => now()->addDays(7)->toDateString(),
            'currency_code' => 'PEN',
            'exchange_rate' => 1,
            'subtotal' => 100,
            'tax_amount' => 18,
            'total' => 118,
            'status' => PurchaseOrder::STATUS_APPROVED,
            'approved_at' => now(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'status' => PurchaseOrder::STATUS_DRAFT,
            'approved_at' => null,
        ]);
    }
}
