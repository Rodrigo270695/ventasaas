<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class,
            UnitSeeder::class,
            PriceListSeeder::class,
            SunatTaxAffectationSeeder::class,
            TaxProfileSeeder::class,
            WarehouseSeeder::class,
            CatalogDemoSeeder::class,
            InventoryDemoSeeder::class,
            PartiesDemoSeeder::class,
            AdminUserSeeder::class,
            DocumentSeriesSeeder::class,
            TreasuryPaymentMethodSeeder::class,
            TreasuryCashRegisterSeeder::class,
        ]);
    }
}
