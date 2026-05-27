<?php

use App\Models\Brand;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

function brandsAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('guests cannot access brands index', function () {
    $this->get(route('admin.catalogo.marcas.index'))
        ->assertRedirect(route('login'));
});

test('admin can view brands index', function () {
    $this->actingAs(brandsAdmin())
        ->get(route('admin.catalogo.marcas.index'))
        ->assertOk();
});

test('brand can be created', function () {
    $this->actingAs(brandsAdmin())
        ->post(route('admin.catalogo.marcas.store'), [
            'code' => 'NIKE',
            'name' => 'Nike',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.catalogo.marcas.index'));

    expect(Brand::query()->where('code', 'NIKE')->exists())->toBeTrue();
});

test('brand can be updated', function () {
    $brand = Brand::factory()->create(['name' => 'Antes']);

    $this->actingAs(brandsAdmin())
        ->put(route('admin.catalogo.marcas.update', $brand), [
            'code' => $brand->code,
            'name' => 'Después',
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.catalogo.marcas.index'));

    expect($brand->fresh()->name)->toBe('Después');
    expect($brand->fresh()->is_active)->toBeFalse();
});

test('brand can be deleted', function () {
    $brand = Brand::factory()->create();

    $this->actingAs(brandsAdmin())
        ->delete(route('admin.catalogo.marcas.destroy', $brand))
        ->assertRedirect(route('admin.catalogo.marcas.index'));

    expect(Brand::query()->find($brand->id))->toBeNull();
});
