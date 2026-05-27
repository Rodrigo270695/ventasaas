<?php

namespace Database\Factories;

use App\Models\TaxProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaxProfile>
 */
class TaxProfileFactory extends Factory
{
    protected $model = TaxProfile::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $code = strtoupper(fake()->unique()->lexify('???'));

        return [
            'code' => $code,
            'name' => fake()->words(3, true),
            'sunat_affectation_code' => '10',
            'igv_rate' => 18,
            'isc_rate' => null,
            'is_default' => false,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
