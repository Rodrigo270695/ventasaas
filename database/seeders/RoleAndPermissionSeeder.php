<?php

namespace Database\Seeders;

use App\Support\PermissionCatalog;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $guard = PermissionCatalog::guard();
        $permissions = PermissionCatalog::allNames();

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, $guard);
        }

        $roles = [
            'admin' => $permissions,
            'sales' => [
                'dashboard.view',
                'catalog.view',
                'units.view',
                'brands.view',
                'categories.view',
                'products.view',
                'price_lists.view',
                'tax_profiles.view',
                'parties.view',
                'parties.create',
                'parties.update',
                'sales.view',
                'sales.create',
                'sales.update',
                'sales.confirm',
                'sales.internal.view',
                'sales.internal.create',
                'sales.internal.update',
                'sales.internal.confirm',
                'sales.quotations.view',
                'sales.quotations.create',
                'sales.quotations.update',
                'sales.quotations.send-email',
                'document_series.view',
                'electronic_documents.view',
            ],
            'warehouse' => [
                'dashboard.view',
                'catalog.view',
                'units.view',
                'brands.view',
                'categories.view',
                'products.view',
                'products.update',
                'parties.view',
                'parties.create',
                'parties.update',
                'warehouses.view',
                'stock_balances.view',
                'stock_balances.adjust',
                'stock_movements.view',
                'purchases.view',
            ],
            'cashier' => [
                'dashboard.view',
                'catalog.view',
                'units.view',
                'brands.view',
                'categories.view',
                'products.view',
                'price_lists.view',
                'tax_profiles.view',
                'sales.view',
                'sales.create',
                'sales.update',
                'sales.confirm',
                'sales.internal.view',
                'sales.internal.create',
                'sales.internal.update',
                'sales.internal.confirm',
                'sales.quotations.view',
                'sales.quotations.create',
                'sales.quotations.update',
                'sales.quotations.send-email',
                'document_series.view',
                'electronic_documents.view',
            ],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::findOrCreate($roleName, $guard);
            $role->syncPermissions($rolePermissions);
        }
    }
}
