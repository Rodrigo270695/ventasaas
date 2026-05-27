<?php

use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->seed(\Database\Seeders\PriceListSeeder::class);
});

function productPricesAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('product price can be stored for variant', function () {
    $product = Product::factory()->create();
    $variant = $product->variants()->first();
    $list = PriceList::query()->where('code', 'RETAIL')->first();

    $this->actingAs(productPricesAdmin())
        ->post(route('admin.catalogo.productos.precios.store', $product), [
            'product_variant_id' => $variant->id,
            'price_list_id' => $list->id,
            'amount' => 19.9,
        ])
        ->assertRedirect(route('admin.catalogo.productos.show', [
            'producto' => $product,
            'tab' => 'precios',
        ]));

    expect(
        ProductPrice::query()
            ->where('product_variant_id', $variant->id)
            ->where('price_list_id', $list->id)
            ->where('amount', 19.9)
            ->exists(),
    )->toBeTrue();
});

test('product price store upserts existing row', function () {
    $product = Product::factory()->create();
    $variant = $product->variants()->first();
    $list = PriceList::query()->where('code', 'RETAIL')->first();

    ProductPrice::create([
        'product_variant_id' => $variant->id,
        'price_list_id' => $list->id,
        'amount' => 10,
        'source' => ProductPrice::SOURCE_MANUAL,
    ]);

    $this->actingAs(productPricesAdmin())
        ->post(route('admin.catalogo.productos.precios.store', $product), [
            'product_variant_id' => $variant->id,
            'price_list_id' => $list->id,
            'amount' => 15,
        ])
        ->assertRedirect(route('admin.catalogo.productos.show', [
            'producto' => $product,
            'tab' => 'precios',
        ]));

    expect(
        ProductPrice::query()
            ->where('product_variant_id', $variant->id)
            ->where('price_list_id', $list->id)
            ->count(),
    )->toBe(1);

    expect(
        (string) ProductPrice::query()
            ->where('product_variant_id', $variant->id)
            ->where('price_list_id', $list->id)
            ->value('amount'),
    )->toBe('15.0000');
});

test('product price can be updated', function () {
    $product = Product::factory()->create();
    $variant = $product->variants()->first();
    $list = PriceList::query()->where('code', 'RETAIL')->first();

    $price = ProductPrice::create([
        'product_variant_id' => $variant->id,
        'price_list_id' => $list->id,
        'amount' => 10,
        'source' => ProductPrice::SOURCE_MANUAL,
    ]);

    $this->actingAs(productPricesAdmin())
        ->put(route('admin.catalogo.productos.precios.update', [
            'producto' => $product,
            'precio' => $price,
        ]), [
            'amount' => 12.5,
        ])
        ->assertRedirect(route('admin.catalogo.productos.show', [
            'producto' => $product,
            'tab' => 'precios',
        ]));

    expect((string) $price->fresh()->amount)->toBe('12.5000');
});
