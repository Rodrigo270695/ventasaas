<?php

use App\Models\PriceList;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->seed(\Database\Seeders\PriceListSeeder::class);
});

function priceListsAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('guests cannot access price lists index', function () {
    $this->get(route('admin.catalogo.listas-precios.index'))
        ->assertRedirect(route('login'));
});

test('admin can view price lists index', function () {
    $this->actingAs(priceListsAdmin())
        ->get(route('admin.catalogo.listas-precios.index'))
        ->assertOk();
});

test('price list can be created', function () {
    $this->actingAs(priceListsAdmin())
        ->post(route('admin.catalogo.listas-precios.store'), [
            'code' => 'OUTLET',
            'name' => 'Outlet',
            'currency_code' => 'PEN',
            'is_default' => false,
            'is_active' => true,
            'sort_order' => 40,
        ])
        ->assertRedirect(route('admin.catalogo.listas-precios.index'));

    expect(PriceList::query()->where('code', 'OUTLET')->exists())->toBeTrue();
});

test('only one default price list is kept', function () {
    $retail = PriceList::query()->where('code', 'RETAIL')->first();

    $this->actingAs(priceListsAdmin())
        ->post(route('admin.catalogo.listas-precios.store'), [
            'code' => 'NEWDEF',
            'name' => 'Nueva default',
            'currency_code' => 'PEN',
            'is_default' => true,
            'is_active' => true,
            'sort_order' => 5,
        ])
        ->assertRedirect(route('admin.catalogo.listas-precios.index'));

    expect(PriceList::query()->where('code', 'NEWDEF')->value('is_default'))->toBeTrue();
    expect($retail?->fresh()?->is_default)->toBeFalse();
});

test('price list can be updated without code unique conflict', function () {
    $list = PriceList::query()->where('code', 'WEB')->first();

    $this->actingAs(priceListsAdmin())
        ->put(route('admin.catalogo.listas-precios.update', $list), [
            'code' => 'WEB',
            'name' => 'Tienda web',
            'currency_code' => 'PEN',
            'is_default' => false,
            'is_active' => true,
            'sort_order' => 20,
        ])
        ->assertRedirect(route('admin.catalogo.listas-precios.index'))
        ->assertSessionHasNoErrors();
});

test('default price list cannot be deleted', function () {
    $list = PriceList::query()->where('is_default', true)->first();

    $this->actingAs(priceListsAdmin())
        ->delete(route('admin.catalogo.listas-precios.destroy', $list))
        ->assertRedirect(route('admin.catalogo.listas-precios.index'));

    expect($list?->fresh())->not->toBeNull();
});
