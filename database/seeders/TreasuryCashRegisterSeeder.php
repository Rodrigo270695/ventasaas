<?php

namespace Database\Seeders;

use App\Models\TreasuryCashRegister;
use Illuminate\Database\Seeder;

class TreasuryCashRegisterSeeder extends Seeder
{
    public function run(): void
    {
        TreasuryCashRegister::query()->updateOrCreate(
            ['code' => 'PRINCIPAL'],
            [
                'name' => 'Caja principal',
                'is_active' => true,
                'sort_order' => 10,
            ],
        );
    }
}
