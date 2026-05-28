<?php

use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductVariant;
use App\Models\StockBalance;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

function productsAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('guests cannot access products index', function () {
    $this->get(route('admin.catalogo.productos.index'))
        ->assertRedirect(route('login'));
});

test('admin can view products index', function () {
    $this->actingAs(productsAdmin())
        ->get(route('admin.catalogo.productos.index'))
        ->assertOk();
});

test('admin can view product show page', function () {
    $product = Product::factory()->create(['name' => 'Ficha demo']);

    $this->actingAs(productsAdmin())
        ->get(route('admin.catalogo.productos.show', $product))
        ->assertOk();
});

test('product can be created with initial variant', function () {
    $category = ProductCategory::factory()->create();
    $brand = Brand::factory()->create();
    $unit = Unit::factory()->create();

    $response = $this->actingAs(productsAdmin())
        ->post(route('admin.catalogo.productos.store'), [
            'name' => 'Arroz costeño',
            'description' => 'Saco 1 kg',
            'type' => 'good',
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'base_unit_id' => $unit->id,
            'track_stock' => true,
            'is_active' => true,
            'initial_variant' => [
                'sku' => 'ARROZ-01',
                'label' => '1 kg',
                'barcode' => '7750123456789',
            ],
        ]);

    $product = Product::query()->where('name', 'Arroz costeño')->first();

    expect($product)->not->toBeNull();

    $response->assertRedirect(route('admin.catalogo.productos.show', [
        'producto' => $product,
        'tab' => 'variantes',
    ]));
    expect(ProductVariant::query()->where('sku', 'ARROZ-01')->exists())->toBeTrue();
    expect(
        ProductVariant::query()
            ->where('product_id', $product->id)
            ->where('barcode', '7750123456789')
            ->exists(),
    )->toBeTrue();
    expect($product->variants()->where('is_default', true)->exists())->toBeTrue();
});

test('admin can fetch product stock summary', function () {
    $warehouse = Warehouse::factory()->defaultWarehouse()->create();
    $product = Product::factory()->create(['track_stock' => true, 'type' => 'good']);
    $variant = $product->variants()->first();

    StockBalance::query()->create([
        'warehouse_id' => $warehouse->id,
        'product_variant_id' => $variant->id,
        'quantity_on_hand' => '12.5000',
        'quantity_reserved' => '0',
        'avg_cost' => '8.2500',
    ]);

    $this->actingAs(productsAdmin())
        ->getJson(route('admin.catalogo.productos.stock-resumen', [
            'producto' => $product,
            'warehouse_id' => $warehouse->id,
        ]))
        ->assertOk()
        ->assertJsonPath('product_id', $product->id)
        ->assertJsonPath('variants.0.sku', $variant->sku)
        ->assertJsonPath('variants.0.quantity_on_hand', '12.5000')
        ->assertJsonPath('variants.0.avg_cost', '8.2500');
});

test('product can be updated', function () {
    $product = Product::factory()->create(['name' => 'Antes']);
    $variant = $product->variants()->first();

    $this->actingAs(productsAdmin())
        ->put(route('admin.catalogo.productos.update', $product), [
            'name' => 'Después',
            'description' => null,
            'type' => 'service',
            'category_id' => null,
            'brand_id' => null,
            'base_unit_id' => $product->base_unit_id,
            'track_stock' => false,
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.catalogo.productos.show', [
            'producto' => $product,
            'tab' => 'general',
        ]));

    $product->refresh();

    expect($product->name)->toBe('Después');
    expect($product->type)->toBe('service');
    expect($variant?->fresh())->not->toBeNull();
});

test('product can be deleted', function () {
    $product = Product::factory()->create();

    $this->actingAs(productsAdmin())
        ->delete(route('admin.catalogo.productos.destroy', $product))
        ->assertRedirect(route('admin.catalogo.productos.index'));

    expect(Product::query()->find($product->id))->toBeNull();
});

test('variant sku must be unique', function () {
    $product = Product::factory()->create();
    $existingSku = $product->variants()->first()->sku;
    $unit = Unit::factory()->create();

    $this->actingAs(productsAdmin())
        ->post(route('admin.catalogo.productos.store'), [
            'name' => 'Otro producto',
            'type' => 'good',
            'base_unit_id' => $unit->id,
            'track_stock' => true,
            'is_active' => true,
            'initial_variant' => [
                'sku' => $existingSku,
            ],
        ])
        ->assertSessionHasErrors('initial_variant.sku');
});

test('additional variant can be added to product', function () {
    $product = Product::factory()->create();

    $this->actingAs(productsAdmin())
        ->post(route('admin.catalogo.productos.variantes.store', $product), [
            'sku' => 'EXTRA-01',
            'label' => 'Pack x6',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.catalogo.productos.show', [
            'producto' => $product,
            'tab' => 'variantes',
        ]));

    expect($product->variants()->where('sku', 'EXTRA-01')->exists())->toBeTrue();
});

test('last variant cannot be deleted', function () {
    $product = Product::factory()->create();
    $variant = $product->variants()->first();

    $this->actingAs(productsAdmin())
        ->delete(route('admin.catalogo.productos.variantes.destroy', [
            'producto' => $product,
            'variante' => $variant,
        ]))
        ->assertRedirect(route('admin.catalogo.productos.show', [
            'producto' => $product,
            'tab' => 'variantes',
        ]));

    expect($variant->fresh())->not->toBeNull();
});
