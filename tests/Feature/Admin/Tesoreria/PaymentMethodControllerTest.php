<?php

use App\Models\TreasuryPaymentMethod;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->seed(\Database\Seeders\TreasuryPaymentMethodSeeder::class);
});

test('guests cannot access payment methods index', function () {
    $this->get(route('admin.tesoreria.metodos-pago.index'))
        ->assertRedirect(route('login'));
});

test('admin can view payment methods index', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user)
        ->get(route('admin.tesoreria.metodos-pago.index'))
        ->assertOk();
});

test('admin can create a payment method with auto code and sort order', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $maxSort = (int) TreasuryPaymentMethod::query()->max('sort_order');

    $this->actingAs($user)
        ->post(route('admin.tesoreria.metodos-pago.store'), [
            'name' => 'Cheque',
            'type' => 'other',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.tesoreria.metodos-pago.index'));

    $method = TreasuryPaymentMethod::query()->where('name', 'Cheque')->first();
    expect($method)->not->toBeNull()
        ->and($method->code)->toBe('cheque')
        ->and($method->sort_order)->toBe($maxSort + 10);
});

test('admin can update payment method without code field', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $method = TreasuryPaymentMethod::query()->where('code', 'cash')->firstOrFail();
    $originalCode = $method->code;

    $this->actingAs($user)
        ->put(route('admin.tesoreria.metodos-pago.update', $method), [
            'name' => 'Efectivo actualizado',
            'type' => 'cash',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.tesoreria.metodos-pago.index'));

    expect($method->fresh()->name)->toBe('Efectivo actualizado')
        ->and($method->fresh()->code)->toBe($originalCode);
});
