<?php

namespace Database\Factories;

use App\Models\Party;
use App\Models\PurchaseDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseDocument>
 */
class PurchaseDocumentFactory extends Factory
{
    protected $model = PurchaseDocument::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 50, 500);
        $tax = round($subtotal * 0.18, 2);

        return [
            'supplier_party_id' => Party::factory()->supplier(),
            'internal_number' => 'FP-'.now()->format('Y').'-'.fake()->unique()->numerify('######'),
            'supplier_document_number' => 'F'.fake()->numerify('###-#######'),
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'currency_code' => 'PEN',
            'exchange_rate' => 1,
            'subtotal' => $subtotal,
            'tax_amount' => $tax,
            'total' => $subtotal + $tax,
            'status' => PurchaseDocument::STATUS_CONFIRMED,
            'payment_status' => PurchaseDocument::PAYMENT_UNPAID,
            'notes' => null,
        ];
    }
}
