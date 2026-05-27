<?php

namespace Database\Factories;

use App\Models\CfgStoreSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CfgStoreSetting>
 */
class CfgStoreSettingFactory extends Factory
{
    protected $model = CfgStoreSetting::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ruc' => '20'.fake()->numerify('#########'),
            'razon_social' => fake()->company(),
            'ubigeo' => '150101',
            'direccion' => fake()->streetAddress(),
            'tax_regime' => 'general',
            'billing_channel' => 'direct_sunat',
            'sunat_environment' => 'beta',
            'default_igv_rate' => 18,
        ];
    }
}
