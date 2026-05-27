<?php

use App\Models\User;
use App\Support\PermissionCatalog;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('guests cannot access roles index', function () {
    $this->get(route('admin.sistema.roles.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can view roles index', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user)
        ->get(route('admin.sistema.roles.index'))
        ->assertOk();
});

test('users without roles.view cannot access roles index', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'viewer', 'guard_name' => 'web']);
    $role->givePermissionTo('dashboard.view');
    $user->assignRole($role);

    $this->actingAs($user)
        ->get(route('admin.sistema.roles.index'))
        ->assertForbidden();
});

test('roles index includes users count per role', function () {
    $actor = User::factory()->create();
    $actor->assignRole('admin');

    User::factory()->create()->assignRole('admin');

    $roles = $this->actingAs($actor)
        ->get(route('admin.sistema.roles.index'))
        ->assertOk()
        ->inertiaProps('roles');

    $adminRole = collect($roles)->firstWhere('name', 'admin');

    expect($adminRole)->not->toBeNull();
    expect($adminRole['users_count'])->toBe(2);
});

test('roles index shares permission catalog for assigners', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user)
        ->get(route('admin.sistema.roles.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('permissionCatalog')
            ->where('permissionCatalog', PermissionCatalog::groups()));
});

test('create and edit named routes are not registered', function () {
    expect(Route::has('admin.sistema.roles.create'))->toBeFalse();
    expect(Route::has('admin.sistema.roles.edit'))->toBeFalse();
});

test('role can be stored with shared request', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user)
        ->post(route('admin.sistema.roles.store'), ['name' => 'supervisor'])
        ->assertRedirect(route('admin.sistema.roles.index'));

    expect(Role::findByName('supervisor', 'web'))->not->toBeNull();
});

test('users without roles.create cannot store roles', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'viewer', 'guard_name' => 'web']);
    $role->givePermissionTo('roles.view');
    $user->assignRole($role);

    $this->actingAs($user)
        ->post(route('admin.sistema.roles.store'), ['name' => 'blocked'])
        ->assertForbidden();

    expect(Role::where('name', 'blocked')->exists())->toBeFalse();
});

test('roles index reset query clears modal flash', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user)
        ->withSession(['roleModal' => 'create'])
        ->get(route('admin.sistema.roles.index', ['_reset' => 1]))
        ->assertOk()
        ->assertSessionMissing('roleModal');
});

test('role with assigned users cannot be deleted', function () {
    $actor = User::factory()->create();
    $actor->assignRole('admin');

    $role = Role::create(['name' => 'supervisor', 'guard_name' => 'web']);
    User::factory()->create()->assignRole($role);

    $this->actingAs($actor)
        ->delete(route('admin.sistema.roles.destroy', $role))
        ->assertRedirect(route('admin.sistema.roles.index'));

    expect(Role::findByName('supervisor', 'web'))->not->toBeNull();
});

test('role permissions can be synced', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $role = Role::create(['name' => 'editor', 'guard_name' => 'web']);

    $this->actingAs($user)
        ->put(route('admin.sistema.roles.permissions.update', $role), [
            'permissions' => ['roles.view', 'roles.update'],
        ])
        ->assertRedirect(route('admin.sistema.roles.index'));

    $role->refresh();

    expect($role->permissions->pluck('name')->all())
        ->toEqualCanonicalizing(['roles.view', 'roles.update']);
});

test('users without assign permission cannot sync role permissions', function () {
    $user = User::factory()->create();
    $role = Role::create(['name' => 'viewer', 'guard_name' => 'web']);
    $role->givePermissionTo(['roles.view', 'roles.update']);
    $user->assignRole($role);

    $target = Role::create(['name' => 'editor', 'guard_name' => 'web']);

    $this->actingAs($user)
        ->put(route('admin.sistema.roles.permissions.update', $target), [
            'permissions' => ['roles.view'],
        ])
        ->assertForbidden();
});

test('admin role permissions cannot be modified', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $adminRole = Role::findByName('admin', 'web');
    $before = $adminRole->permissions->pluck('name')->sort()->values()->all();

    $this->actingAs($user)
        ->put(route('admin.sistema.roles.permissions.update', $adminRole), [
            'permissions' => ['dashboard.view'],
        ])
        ->assertRedirect(route('admin.sistema.roles.index'));

    $adminRole->refresh();

    expect($adminRole->permissions->pluck('name')->sort()->values()->all())
        ->toBe($before);
});

test('role permissions seeder registers sistema permissions', function () {
    expect(Permission::where('name', 'roles.assign-permissions')->exists())->toBeTrue();
    expect(Permission::where('name', 'roles.view')->exists())->toBeTrue();
});

test('permission catalog includes implemented catalog modules', function () {
    $groups = collect(PermissionCatalog::groups());
    $keys = $groups->pluck('key')->all();

    expect($keys)->toContain('categories', 'brands', 'units', 'store_settings');

    $implemented = $groups->where('implemented', true)->pluck('key')->all();

    expect($implemented)->toContain('categories', 'brands', 'units', 'products');
    expect($implemented)->not->toContain('inventory');
});
