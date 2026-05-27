<?php

use App\Models\User;
use App\Models\Warehouse;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

function inventoryAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('guests cannot access warehouses index', function () {
    $this->get(route('admin.inventario.almacenes.index'))
        ->assertRedirect(route('login'));
});

test('admin can view warehouses index', function () {
    $this->actingAs(inventoryAdmin())
        ->get(route('admin.inventario.almacenes.index'))
        ->assertOk();
});

test('warehouse can be created', function () {
    $this->actingAs(inventoryAdmin())
        ->post(route('admin.inventario.almacenes.store'), [
            'code' => 'TIENDA',
            'name' => 'Tienda centro',
            'is_default' => false,
            'is_saleable' => true,
            'is_active' => true,
            'sort_order' => 1,
        ])
        ->assertRedirect(route('admin.inventario.almacenes.index'));

    expect(Warehouse::query()->where('code', 'TIENDA')->exists())->toBeTrue();
});

test('default warehouse clears others', function () {
    $first = Warehouse::factory()->create(['is_default' => true]);
    $second = Warehouse::factory()->create(['is_default' => false]);

    $this->actingAs(inventoryAdmin())
        ->put(route('admin.inventario.almacenes.update', $second), [
            'code' => $second->code,
            'name' => $second->name,
            'is_default' => true,
            'is_saleable' => true,
            'is_active' => true,
            'sort_order' => 0,
        ])
        ->assertRedirect(route('admin.inventario.almacenes.index'));

    expect($first->fresh()->is_default)->toBeFalse();
    expect($second->fresh()->is_default)->toBeTrue();
});
