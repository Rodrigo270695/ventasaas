<?php

use App\Models\Unit;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->seed(\Database\Seeders\UnitSeeder::class);
});

function catalogAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('guests cannot access units index', function () {
    $this->get(route('admin.catalogo.unidades.index'))
        ->assertRedirect(route('login'));
});

test('admin can view units index', function () {
    $this->actingAs(catalogAdmin())
        ->get(route('admin.catalogo.unidades.index'))
        ->assertOk();
});

test('users without units.view cannot access units index', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user)
        ->get(route('admin.catalogo.unidades.index'))
        ->assertForbidden();
});

test('unit can be created', function () {
    $this->actingAs(catalogAdmin())
        ->post(route('admin.catalogo.unidades.store'), [
            'code' => 'SET',
            'name' => 'Set',
            'sunat_code' => 'SET',
            'symbol' => 'set',
            'allows_decimals' => false,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.catalogo.unidades.index'));

    expect(Unit::query()->where('code', 'SET')->exists())->toBeTrue();
});

test('unit can be updated', function () {
    $unit = Unit::factory()->create(['name' => 'Antes']);

    $this->actingAs(catalogAdmin())
        ->put(route('admin.catalogo.unidades.update', $unit), [
            'code' => $unit->code,
            'name' => 'Después',
            'sunat_code' => $unit->sunat_code,
            'symbol' => $unit->symbol,
            'allows_decimals' => true,
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.catalogo.unidades.index'));

    expect($unit->fresh()->name)->toBe('Después');
    expect($unit->fresh()->allows_decimals)->toBeTrue();
    expect($unit->fresh()->is_active)->toBeFalse();
});

test('unit code must be unique', function () {
    Unit::factory()->create(['code' => 'ZZZ']);

    $this->actingAs(catalogAdmin())
        ->post(route('admin.catalogo.unidades.store'), [
            'code' => 'ZZZ',
            'name' => 'Duplicado',
            'allows_decimals' => false,
            'is_active' => true,
        ])
        ->assertSessionHasErrors('code');
});

test('unit can be deleted', function () {
    $unit = Unit::factory()->create();

    $this->actingAs(catalogAdmin())
        ->delete(route('admin.catalogo.unidades.destroy', $unit))
        ->assertRedirect(route('admin.catalogo.unidades.index'));

    expect(Unit::query()->find($unit->id))->toBeNull();
    expect(Unit::withTrashed()->find($unit->id))->not->toBeNull();
});

test('warehouse role can view but not create units', function () {
    $user = User::factory()->create();
    $user->assignRole('warehouse');

    $this->actingAs($user)
        ->get(route('admin.catalogo.unidades.index'))
        ->assertOk();

    $this->actingAs($user)
        ->post(route('admin.catalogo.unidades.store'), [
            'code' => 'NEW',
            'name' => 'Nueva',
            'allows_decimals' => false,
            'is_active' => true,
        ])
        ->assertForbidden();
});
