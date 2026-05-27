<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            [
                'code' => 'NIU',
                'name' => 'Unidad',
                'sunat_code' => 'NIU',
                'symbol' => 'und',
                'allows_decimals' => false,
            ],
            [
                'code' => 'KGM',
                'name' => 'Kilogramo',
                'sunat_code' => 'KGM',
                'symbol' => 'kg',
                'allows_decimals' => true,
            ],
            [
                'code' => 'LTR',
                'name' => 'Litro',
                'sunat_code' => 'LTR',
                'symbol' => 'L',
                'allows_decimals' => true,
            ],
            [
                'code' => 'MTR',
                'name' => 'Metro',
                'sunat_code' => 'MTR',
                'symbol' => 'm',
                'allows_decimals' => true,
            ],
            [
                'code' => 'BX',
                'name' => 'Caja',
                'sunat_code' => 'BX',
                'symbol' => 'caja',
                'allows_decimals' => false,
            ],
        ];

        foreach ($defaults as $row) {
            Unit::query()->updateOrCreate(
                ['code' => $row['code']],
                [...$row, 'is_active' => true],
            );
        }
    }
}
