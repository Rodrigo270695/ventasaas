<?php

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Warehouse;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('guests cannot access stock movements index', function () {
    $this->get(route('admin.inventario.movimientos.index'))
        ->assertRedirect(route('login'));
});

test('user without permission cannot access stock movements index', function () {
    $user = User::factory()->create();
    $user->assignRole('cashier');

    $this->actingAs($user)
        ->get(route('admin.inventario.movimientos.index'))
        ->assertForbidden();
});

test('warehouse role can view kardex after adjustment', function () {
    $user = User::factory()->create();
    $user->assignRole('warehouse');

    $warehouse = Warehouse::factory()->defaultWarehouse()->create();
    $product = Product::factory()->create(['track_stock' => true]);
    $variant = ProductVariant::factory()->for($product)->create();

    $this->actingAs($user)
        ->post(route('admin.inventario.saldos.ajustes.store'), [
            'warehouse_id' => $warehouse->id,
            'product_variant_id' => $variant->id,
            'quantity_on_hand' => 10,
            'unit_cost' => 4.5,
        ]);

    $this->actingAs($user)
        ->get(route('admin.inventario.movimientos.index', [
            'warehouse_id' => $warehouse->id,
            'product_variant_id' => $variant->id,
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/inventario/movimientos/index')
            ->has('movements', 1)
            ->where('showBalanceColumn', true)
            ->where('movements.0.quantity', '10.0000')
            ->where('movements.0.balance_after', '10.0000')
            ->where('movements.0.movement_type', StockMovement::TYPE_OPENING));
});

test('admin can filter kardex by warehouse', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $warehouseA = Warehouse::factory()->create(['code' => 'A1']);
    $warehouseB = Warehouse::factory()->create(['code' => 'B1']);
    $variant = ProductVariant::factory()
        ->for(Product::factory()->create(['track_stock' => true]))
        ->create();

    $this->actingAs($user)
        ->post(route('admin.inventario.saldos.ajustes.store'), [
            'warehouse_id' => $warehouseA->id,
            'product_variant_id' => $variant->id,
            'quantity_on_hand' => 5,
            'unit_cost' => 2,
        ]);

    $this->actingAs($user)
        ->post(route('admin.inventario.saldos.ajustes.store'), [
            'warehouse_id' => $warehouseB->id,
            'product_variant_id' => $variant->id,
            'quantity_on_hand' => 3,
            'unit_cost' => 2,
        ]);

    $this->actingAs($user)
        ->get(route('admin.inventario.movimientos.index', [
            'warehouse_id' => $warehouseA->id,
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('movements', 1)
            ->where('movements.0.warehouse_code', 'A1'));
});
