<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Role;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('guests cannot access users index', function () {
    $this->get(route('admin.sistema.usuarios.index'))
        ->assertRedirect(route('login'));
});

test('authenticated admin can view users index', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user)
        ->get(route('admin.sistema.usuarios.index'))
        ->assertOk();
});

test('users without users.view cannot access users index', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'viewer', 'guard_name' => 'web']);
    $role->givePermissionTo('dashboard.view');
    $user->assignRole($role);

    $this->actingAs($user)
        ->get(route('admin.sistema.usuarios.index'))
        ->assertForbidden();
});

test('user can be stored', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->post(route('admin.sistema.usuarios.store'), [
            'name' => 'Nuevo Usuario',
            'email' => 'nuevo@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'is_active' => '1',
        ])
        ->assertRedirect(route('admin.sistema.usuarios.index'));

    expect(User::where('email', 'nuevo@example.com')->exists())->toBeTrue();
});

test('users without users.create cannot store users', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'viewer', 'guard_name' => 'web']);
    $role->givePermissionTo('users.view');
    $user->assignRole($role);

    $this->actingAs($user)
        ->post(route('admin.sistema.usuarios.store'), [
            'name' => 'Bloqueado',
            'email' => 'bloqueado@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertForbidden();
});

test('user cannot delete themselves', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->delete(route('admin.sistema.usuarios.destroy', $admin))
        ->assertRedirect(route('admin.sistema.usuarios.index'));

    expect(User::find($admin->id))->not->toBeNull();
});

test('user roles can be synced', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $target = User::factory()->create();
    $cashier = Role::findByName('cashier', 'web');

    $this->actingAs($admin)
        ->put(route('admin.sistema.usuarios.roles.update', $target), [
            'roles' => [$cashier->id],
        ])
        ->assertRedirect(route('admin.sistema.usuarios.index'));

    $target->refresh();

    expect($target->hasRole('cashier'))->toBeTrue();
});

test('users index reset query clears modal flash', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->withSession(['userModal' => 'create'])
        ->get(route('admin.sistema.usuarios.index', ['_reset' => 1]))
        ->assertOk()
        ->assertSessionMissing('userModal');
});

test('create and edit named routes are not registered', function () {
    expect(Route::has('admin.sistema.usuarios.create'))->toBeFalse();
    expect(Route::has('admin.sistema.usuarios.edit'))->toBeFalse();
});

test('granular user permissions are seeded', function () {
    expect(\Spatie\Permission\Models\Permission::where('name', 'users.assign-roles')->exists())->toBeTrue();
    expect(\Spatie\Permission\Models\Permission::where('name', 'users.create')->exists())->toBeTrue();
});
