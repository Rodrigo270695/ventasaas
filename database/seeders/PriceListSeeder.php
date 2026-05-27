<?php

namespace Database\Seeders;

use App\Models\PriceList;
use Illuminate\Database\Seeder;

class PriceListSeeder extends Seeder
{
    public function run(): void
    {
        $lists = [
            [
                'code' => 'RETAIL',
                'name' => 'Público / tienda',
                'currency_code' => 'PEN',
                'is_default' => true,
                'is_active' => true,
                'sort_order' => 10,
            ],
            [
                'code' => 'WEB',
                'name' => 'Tienda web',
                'currency_code' => 'PEN',
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 20,
            ],
            [
                'code' => 'WHOLESALE',
                'name' => 'Mayorista',
                'currency_code' => 'PEN',
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 30,
            ],
        ];

        foreach ($lists as $list) {
            PriceList::query()->updateOrCreate(
                ['code' => $list['code']],
                $list,
            );
        }
    }
}
