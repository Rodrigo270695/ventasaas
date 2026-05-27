<?php

namespace Database\Seeders;

use App\Models\TaxProfile;
use Illuminate\Database\Seeder;

class TaxProfileSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            [
                'code' => 'GRAVADO-18',
                'name' => 'Gravado IGV 18%',
                'sunat_affectation_code' => '10',
                'igv_rate' => 18,
                'isc_rate' => null,
                'is_default' => true,
                'is_active' => true,
                'sort_order' => 10,
            ],
            [
                'code' => 'EXONERADO',
                'name' => 'Exonerado',
                'sunat_affectation_code' => '20',
                'igv_rate' => 0,
                'isc_rate' => null,
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 20,
            ],
            [
                'code' => 'INAFECTO',
                'name' => 'Inafecto',
                'sunat_affectation_code' => '30',
                'igv_rate' => 0,
                'isc_rate' => null,
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 30,
            ],
            [
                'code' => 'EXPORT',
                'name' => 'Exportación',
                'sunat_affectation_code' => '40',
                'igv_rate' => 0,
                'isc_rate' => null,
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 40,
            ],
        ];

        foreach ($profiles as $profile) {
            TaxProfile::query()->updateOrCreate(
                ['code' => $profile['code']],
                $profile,
            );
        }
    }
}
