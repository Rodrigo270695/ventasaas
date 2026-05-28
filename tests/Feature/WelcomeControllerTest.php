<?php

use App\Models\CfgStoreSetting;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPrice;
use App\Models\ProductVariant;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('welcome page shows public catalog', function () {
    $category = ProductCategory::factory()->create(['name' => 'Cereales']);
    $priceList = PriceList::factory()->create(['is_default' => true, 'is_active' => true]);
    $product = Product::factory()->create([
        'name' => 'Chifles acevichados',
        'category_id' => $category->id,
        'is_active' => true,
    ]);
    $variant = ProductVariant::factory()->create([
        'product_id' => $product->id,
        'sku' => 'CHIFLES',
        'label' => 'Estándar',
        'is_default' => true,
        'is_active' => true,
    ]);
    ProductPrice::factory()->create([
        'product_variant_id' => $variant->id,
        'price_list_id' => $priceList->id,
        'amount' => 12.5,
    ]);

    CfgStoreSetting::factory()->create([
        'whatsapp_number' => '51999888777',
        'razon_social' => 'Choko House SAC',
    ]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->has('heroSlides', 0)
            ->has('products', 1)
            ->where('products.0.name', 'Chifles acevichados')
            ->where('store.whatsapp_number', '51999888777')
            ->has('categories', 1));
});

test('welcome page excludes products without price', function () {
    PriceList::factory()->create(['is_default' => true, 'is_active' => true]);
    Product::factory()->create(['is_active' => true]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->has('products', 0));
});
