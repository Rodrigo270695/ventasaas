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

test('packaging breakdown converts variants in same warehouse', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $warehouse = Warehouse::factory()->defaultWarehouse()->create();
    $product = Product::factory()->create(['track_stock' => true]);

    $caja = ProductVariant::factory()->for($product)->create(['sku' => 'CAJA-01']);
    $unidad = ProductVariant::factory()->for($product)->create(['sku' => 'UNID-01']);

    StockBalance::query()->create([
        'warehouse_id' => $warehouse->id,
        'product_variant_id' => $caja->id,
        'quantity_on_hand' => 5,
        'quantity_reserved' => 0,
        'avg_cost' => 24,
    ]);

    $this->actingAs($user)
        ->post(route('admin.inventario.saldos.desgloses.store'), [
            'warehouse_id' => $warehouse->id,
            'from_variant_id' => $caja->id,
            'to_variant_id' => $unidad->id,
            'quantity_from' => 1,
            'quantity_to' => 24,
        ])
        ->assertRedirect(route('admin.inventario.saldos.index', [
            'warehouse_id' => $warehouse->id,
        ]));

    expect(
        (float) StockBalance::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('product_variant_id', $caja->id)
            ->value('quantity_on_hand'),
    )->toBe(4.0);

    expect(
        (float) StockBalance::query()
            ->where('warehouse_id', $warehouse->id)
            ->where('product_variant_id', $unidad->id)
            ->value('quantity_on_hand'),
    )->toBe(24.0);

    expect(StockMovement::query()->where('movement_type', 'breakdown')->count())->toBe(1);
});
