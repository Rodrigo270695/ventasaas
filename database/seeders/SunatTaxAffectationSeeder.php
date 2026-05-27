<?php

namespace Database\Seeders;

use App\Models\SunatTaxAffectation;
use Illuminate\Database\Seeder;

class SunatTaxAffectationSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['code' => '10', 'name' => 'Gravado - Operación onerosa', 'default_igv_rate' => 18],
            ['code' => '20', 'name' => 'Exonerado - Operación onerosa', 'default_igv_rate' => 0],
            ['code' => '30', 'name' => 'Inafecto - Operación onerosa', 'default_igv_rate' => 0],
            ['code' => '40', 'name' => 'Exportación', 'default_igv_rate' => 0],
        ];

        foreach ($rows as $row) {
            SunatTaxAffectation::query()->updateOrCreate(
                ['code' => $row['code']],
                [...$row, 'is_active' => true],
            );
        }
    }
}
