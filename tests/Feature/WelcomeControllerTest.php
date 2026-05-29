<?php

use App\Models\CfgStoreSetting;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductPrice;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('welcome page exposes seo metadata for public catalog', function () {
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
        'direccion' => 'Av. Principal 123, Lima',
    ]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('welcome')
            ->has('seo')
            ->where('seo.title', fn ($title) => str_contains($title, 'Choko House SAC'))
            ->where('seo.robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
            ->where('seo.canonical', url('/'))
            ->has('seo.json_ld', 4)
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
            ->has('seo')
            ->has('products', 0));
});
