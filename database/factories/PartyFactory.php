<?php

namespace Database\Factories;

use App\Models\Party;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Party>
 */
class PartyFactory extends Factory
{
    protected $model = Party::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $isCompany = fake()->boolean(60);

        return [
            'type' => fake()->randomElement([
                Party::TYPE_CUSTOMER,
                Party::TYPE_SUPPLIER,
                Party::TYPE_BOTH,
            ]),
            'document_type' => $isCompany ? Party::DOC_RUC : Party::DOC_DNI,
            'document_number' => $isCompany
                ? (string) fake()->unique()->numerify('20#########')
                : (string) fake()->unique()->numerify('########'),
            'legal_name' => $isCompany ? fake()->company() : fake()->name(),
            'trade_name' => $isCompany ? fake()->optional()->company() : null,
            'address' => $isCompany ? fake()->optional()->address() : null,
            'sunat_estado' => $isCompany ? fake()->optional()->randomElement(['ACTIVO', 'BAJA']) : null,
            'sunat_condicion' => $isCompany ? fake()->optional()->randomElement(['HABIDO', 'NO HABIDO']) : null,
            'email' => fake()->optional()->safeEmail(),
            'phone' => fake()->optional()->numerify('9########'),
            'credit_limit' => fake()->randomFloat(2, 0, 5000),
            'payment_term_days' => fake()->randomElement([0, 7, 15, 30]),
            'is_active' => true,
        ];
    }

    public function customer(): static
    {
        return $this->state(fn () => ['type' => Party::TYPE_CUSTOMER]);
    }

    public function supplier(): static
    {
        return $this->state(fn () => ['type' => Party::TYPE_SUPPLIER]);
    }
}
