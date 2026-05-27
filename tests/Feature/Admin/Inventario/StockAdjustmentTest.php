<?php

use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductVariant;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Warehouse;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->seed(\Database\Seeders\PriceListSeeder::class);
});

test('stock adjustment sets quantity and average cost', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $warehouse = Warehouse::factory()->defaultWarehouse()->create();
    $product = Product::factory()->create(['track_stock' => true]);
    $variant = ProductVariant::factory()->for($product)->create();

    $this->actingAs($user)
        ->post(route('admin.inventario.saldos.ajustes.store'), [
            'warehouse_id' => $warehouse->id,
            'product_variant_id' => $variant->id,
            'quantity_on_hand' => 10,
            'unit_cost' => 5.5,
        ])
        ->assertRedirect(route('admin.inventario.saldos.index', [
            'warehouse_id' => $warehouse->id,
        ]));

    $balance = StockBalance::query()
        ->where('warehouse_id', $warehouse->id)
        ->where('product_variant_id', $variant->id)
        ->first();

    expect($balance)->not->toBeNull();
    expect((float) $balance->quantity_on_hand)->toBe(10.0);
    expect((float) $balance->avg_cost)->toBe(5.5);
    expect(StockMovement::query()->count())->toBe(1);
});

test('weighted average updates on second receipt', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $warehouse = Warehouse::factory()->defaultWarehouse()->create();
    $product = Product::factory()->create(['track_stock' => true]);
    $variant = ProductVariant::factory()->for($product)->create();

    $this->actingAs($user)
        ->post(route('admin.inventario.saldos.ajustes.store'), [
            'warehouse_id' => $warehouse->id,
            'product_variant_id' => $variant->id,
            'quantity_on_hand' => 10,
            'unit_cost' => 10,
        ]);

    $this->actingAs($user)
        ->post(route('admin.inventario.saldos.ajustes.store'), [
            'warehouse_id' => $warehouse->id,
            'product_variant_id' => $variant->id,
            'quantity_on_hand' => 20,
            'unit_cost' => 20,
        ]);

    $balance = StockBalance::query()
        ->where('warehouse_id', $warehouse->id)
        ->where('product_variant_id', $variant->id)
        ->first();

    expect((float) $balance->quantity_on_hand)->toBe(20.0);
    expect((float) $balance->avg_cost)->toBe(15.0);
});

test('opening stock requires unit cost', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $warehouse = Warehouse::factory()->create();
    $variant = ProductVariant::factory()
        ->for(Product::factory()->create())
        ->create();

    $this->actingAs($user)
        ->from(route('admin.inventario.saldos.index'))
        ->post(route('admin.inventario.saldos.ajustes.store'), [
            'warehouse_id' => $warehouse->id,
            'product_variant_id' => $variant->id,
            'quantity_on_hand' => 10,
        ])
        ->assertRedirect();

    expect(StockBalance::query()->count())->toBe(0);
});

test('stock adjustment can sync sale prices from unit cost', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $warehouse = Warehouse::factory()->defaultWarehouse()->create();
    $product = Product::factory()->create(['track_stock' => true]);
    $variant = ProductVariant::factory()->for($product)->create();
    $retail = PriceList::query()->where('code', 'RETAIL')->first();
    $web = PriceList::query()->where('code', 'WEB')->first();

    $this->actingAs($user)
        ->post(route('admin.inventario.saldos.ajustes.store'), [
            'warehouse_id' => $warehouse->id,
            'product_variant_id' => $variant->id,
            'quantity_on_hand' => 10,
            'unit_cost' => 10,
            'sync_sale_prices' => true,
            'price_list_ids' => [$retail->id, $web->id],
            'markup_type' => 'percent',
            'markup_value' => 50,
        ])
        ->assertRedirect(route('admin.inventario.saldos.index', [
            'warehouse_id' => $warehouse->id,
        ]));

    expect(
        ProductPrice::query()
            ->where('product_variant_id', $variant->id)
            ->where('price_list_id', $retail->id)
            ->where('amount', 15)
            ->exists(),
    )->toBeTrue();

    expect(
        ProductPrice::query()
            ->where('product_variant_id', $variant->id)
            ->where('price_list_id', $web->id)
            ->where('amount', 15)
            ->exists(),
    )->toBeTrue();
});
