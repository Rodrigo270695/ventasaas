<?php

use App\Models\Product;
use App\Models\ProductTaxProfile;
use App\Models\TaxProfile;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->seed(\Database\Seeders\SunatTaxAffectationSeeder::class);
    $this->seed(\Database\Seeders\TaxProfileSeeder::class);
});

function variantTaxAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('variant tax profile can be stored', function () {
    $product = Product::factory()->create();
    $variant = $product->variants()->first();
    $template = TaxProfile::query()->where('code', 'GRAVADO-18')->first();

    $this->actingAs(variantTaxAdmin())
        ->post(route('admin.catalogo.productos.perfiles-tributarios.store', $product), [
            'product_variant_id' => $variant->id,
            'tax_profile_id' => $template->id,
            'sunat_affectation_code' => '10',
            'igv_rate' => 18,
            'isc_rate' => null,
        ])
        ->assertRedirect(route('admin.catalogo.productos.show', [
            'producto' => $product,
            'tab' => 'impuestos',
        ]));

    expect(
        ProductTaxProfile::query()
            ->where('product_variant_id', $variant->id)
            ->where('sunat_affectation_code', '10')
            ->exists(),
    )->toBeTrue();
});

test('variant tax profile store upserts existing row', function () {
    $product = Product::factory()->create();
    $variant = $product->variants()->first();
    $template = TaxProfile::query()->where('code', 'GRAVADO-18')->first();

    ProductTaxProfile::create([
        'product_variant_id' => $variant->id,
        'tax_profile_id' => $template->id,
        'sunat_affectation_code' => '10',
        'igv_rate' => 10,
        'isc_rate' => null,
    ]);

    $this->actingAs(variantTaxAdmin())
        ->post(route('admin.catalogo.productos.perfiles-tributarios.store', $product), [
            'product_variant_id' => $variant->id,
            'tax_profile_id' => $template->id,
            'sunat_affectation_code' => '10',
            'igv_rate' => 18,
        ])
        ->assertRedirect(route('admin.catalogo.productos.show', [
            'producto' => $product,
            'tab' => 'impuestos',
        ]));

    expect(
        ProductTaxProfile::query()->where('product_variant_id', $variant->id)->count(),
    )->toBe(1);

    expect(
        (string) ProductTaxProfile::query()
            ->where('product_variant_id', $variant->id)
            ->value('igv_rate'),
    )->toBe('18.0000');
});
