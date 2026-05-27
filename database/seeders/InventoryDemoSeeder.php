<?php

namespace Database\Seeders;

use App\Models\ProductVariant;
use App\Models\StockBalance;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class InventoryDemoSeeder extends Seeder
{
    public function run(): void
    {
        $bodegaId = Warehouse::query()->where('code', 'BODEGA')->value('id');
        $ventaId = Warehouse::query()->where('code', 'VENTA')->value('id');

        if (! $bodegaId || ! $ventaId) {
            $this->command?->warn('InventoryDemoSeeder: ejecuta WarehouseSeeder antes.');

            return;
        }

        /** Stock en bodega (cajas / paquetes — para trasladar al mostrador). */
        $bodegaStock = [
            ['sku' => 'CHOCO-SODA-PQ6', 'qty' => 30, 'cost' => 18.00],
            ['sku' => 'COLA-500-CAJ24', 'qty' => 20, 'cost' => 42.00],
            ['sku' => 'GALLET-VAIN-CAJ12', 'qty' => 25, 'cost' => 15.60],
            ['sku' => 'LECHE-EVAP-CAJ48', 'qty' => 10, 'cost' => 168.00],
            ['sku' => 'YOGURT-FRESA-CAJ6', 'qty' => 18, 'cost' => 30.00],
            ['sku' => 'ARROZ-CAJ10', 'qty' => 40, 'cost' => 32.50],
        ];

        foreach ($bodegaStock as $row) {
            $this->upsertBalance($bodegaId, $row['sku'], $row['qty'], $row['cost']);
        }

        /** En mostrador: pocas unidades sueltas; el resto llega por traslado + desglose. */
        $ventaStock = [
            ['sku' => 'CHOCO-SODA-UN', 'qty' => 6, 'cost' => 3.00],
            ['sku' => 'COLA-500-UN', 'qty' => 12, 'cost' => 1.75],
            ['sku' => 'GALLET-VAIN-UN', 'qty' => 8, 'cost' => 1.30],
        ];

        foreach ($ventaStock as $row) {
            $this->upsertBalance($ventaId, $row['sku'], $row['qty'], $row['cost']);
        }
    }

    private function upsertBalance(string $warehouseId, string $sku, float $qty, float $cost): void
    {
        $variantId = ProductVariant::query()->where('sku', $sku)->value('id');

        if (! $variantId) {
            $this->command?->warn("InventoryDemoSeeder: SKU no encontrado [{$sku}]. Ejecuta CatalogDemoSeeder.");

            return;
        }

        StockBalance::query()->updateOrCreate(
            [
                'warehouse_id' => $warehouseId,
                'product_variant_id' => $variantId,
            ],
            [
                'quantity_on_hand' => $qty,
                'quantity_reserved' => 0,
                'avg_cost' => $cost,
            ],
        );
    }
}
