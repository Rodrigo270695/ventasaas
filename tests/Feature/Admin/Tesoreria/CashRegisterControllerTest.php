<?php

use App\Models\TreasuryCashRegister;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('admin can create a cash register', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user)
        ->post(route('admin.tesoreria.cajas.store'), [
            'name' => 'Caja mostrador',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.tesoreria.cajas.index'));

    $register = TreasuryCashRegister::query()->where('name', 'Caja mostrador')->first();

    expect($register)->not->toBeNull()
        ->and($register->code)->not->toBeEmpty()
        ->and($register->sort_order)->toBeGreaterThan(0);
});
