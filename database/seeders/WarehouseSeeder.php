<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        Warehouse::query()->updateOrCreate(
            ['code' => 'BODEGA'],
            [
                'name' => 'Bodega principal',
                'is_default' => true,
                'is_saleable' => false,
                'is_active' => true,
                'sort_order' => 10,
            ],
        );

        Warehouse::query()->updateOrCreate(
            ['code' => 'VENTA'],
            [
                'name' => 'Mostrador / tienda',
                'is_default' => false,
                'is_saleable' => true,
                'is_active' => true,
                'sort_order' => 20,
            ],
        );

        // Compatibilidad: si existía MAIN del seed anterior, desactivar venta desde bodega.
        Warehouse::query()
            ->where('code', 'MAIN')
            ->update([
                'is_default' => false,
                'is_saleable' => false,
                'name' => 'Almacén legacy (usar BODEGA/VENTA)',
            ]);
    }
}
