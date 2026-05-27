<?php

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Warehouse;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('stock can be transferred between warehouses', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $bodega = Warehouse::factory()->create(['code' => 'BODEGA', 'is_saleable' => false]);
    $venta = Warehouse::factory()->create(['code' => 'VENTA', 'is_saleable' => true, 'is_default' => true]);

    $product = Product::factory()->create(['track_stock' => true]);
    $variant = ProductVariant::factory()->for($product)->create();

    StockBalance::query()->create([
        'warehouse_id' => $bodega->id,
        'product_variant_id' => $variant->id,
        'quantity_on_hand' => 10,
        'quantity_reserved' => 0,
        'avg_cost' => 5,
    ]);

    $this->actingAs($user)
        ->post(route('admin.inventario.saldos.traslados.store'), [
            'from_warehouse_id' => $bodega->id,
            'to_warehouse_id' => $venta->id,
            'product_variant_id' => $variant->id,
            'quantity' => 3,
            'notes' => 'Al mostrador',
        ])
        ->assertRedirect(route('admin.inventario.saldos.index', [
            'warehouse_id' => $venta->id,
        ]));

    expect(
        (float) StockBalance::query()
            ->where('warehouse_id', $bodega->id)
            ->where('product_variant_id', $variant->id)
            ->value('quantity_on_hand'),
    )->toBe(7.0);

    expect(
        (float) StockBalance::query()
            ->where('warehouse_id', $venta->id)
            ->where('product_variant_id', $variant->id)
            ->value('quantity_on_hand'),
    )->toBe(3.0);

    expect(StockMovement::query()->where('movement_type', 'transfer_out')->count())->toBe(1);
    expect(StockMovement::query()->where('movement_type', 'transfer_in')->count())->toBe(1);
});
