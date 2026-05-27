<?php

namespace Database\Seeders;

use App\Models\TreasuryPaymentMethod;
use Illuminate\Database\Seeder;

class TreasuryPaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            ['code' => 'cash', 'name' => 'Efectivo', 'type' => 'cash', 'sort_order' => 10],
            ['code' => 'transfer', 'name' => 'Transferencia', 'type' => 'bank_transfer', 'sort_order' => 20],
            ['code' => 'yape_plin', 'name' => 'Yape / Plin', 'type' => 'digital_wallet', 'sort_order' => 30],
            ['code' => 'card', 'name' => 'Tarjeta', 'type' => 'card', 'sort_order' => 40],
            ['code' => 'other', 'name' => 'Otro', 'type' => 'other', 'sort_order' => 50],
        ];

        foreach ($methods as $method) {
            TreasuryPaymentMethod::query()->updateOrCreate(
                ['code' => $method['code']],
                [
                    'name' => $method['name'],
                    'type' => $method['type'],
                    'is_active' => true,
                    'sort_order' => $method['sort_order'],
                ],
            );
        }
    }
}
