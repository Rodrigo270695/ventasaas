<?php

use App\Models\SalesDocument;
use App\Models\TreasuryCashRegister;
use App\Models\TreasuryCashRegisterSession;
use App\Models\TreasuryPayment;
use App\Models\TreasuryPaymentMethod;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->seed(\Database\Seeders\TreasuryPaymentMethodSeeder::class);
});

function cashSessionAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('admin can open and close a cash register session', function () {
    $register = TreasuryCashRegister::factory()->create();
    $user = cashSessionAdmin();

    $this->actingAs($user)
        ->post(route('admin.tesoreria.sesiones.store'), [
            'cash_register_id' => $register->id,
            'opening_float' => 50,
        ])
        ->assertRedirect(route('admin.tesoreria.sesiones.index', ['status' => 'open']));

    $session = TreasuryCashRegisterSession::query()->first();
    expect($session)->not->toBeNull()
        ->and($session->status)->toBe(TreasuryCashRegisterSession::STATUS_OPEN)
        ->and((float) $session->opening_float)->toBe(50.0);

    $this->actingAs($user)
        ->put(route('admin.tesoreria.sesiones.close', $session), [
            'closing_cash_counted' => 50,
        ])
        ->assertRedirect(route('admin.tesoreria.sesiones.index'));

    expect($session->fresh()->status)->toBe(TreasuryCashRegisterSession::STATUS_CLOSED)
        ->and((float) $session->fresh()->expected_cash)->toBe(50.0)
        ->and((float) $session->fresh()->cash_difference)->toBe(0.0);
});

test('cannot open two sessions on the same register', function () {
    $register = TreasuryCashRegister::factory()->create();
    $user = cashSessionAdmin();

    TreasuryCashRegisterSession::factory()->create([
        'cash_register_id' => $register->id,
        'status' => TreasuryCashRegisterSession::STATUS_OPEN,
        'opened_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->post(route('admin.tesoreria.sesiones.store'), [
            'cash_register_id' => $register->id,
            'opening_float' => 0,
        ])
        ->assertSessionHasErrors('cash_register_id');
});

test('collection links to open session automatically', function () {
    $user = cashSessionAdmin();
    $register = TreasuryCashRegister::factory()->create();

    $session = TreasuryCashRegisterSession::factory()->create([
        'cash_register_id' => $register->id,
        'opened_by' => $user->id,
        'opening_float' => 100,
    ]);

    $document = SalesDocument::factory()
        ->confirmed()
        ->create(['total' => 50, 'payment_status' => SalesDocument::PAYMENT_UNPAID]);

    $method = TreasuryPaymentMethod::query()->where('code', 'cash')->firstOrFail();

    $this->actingAs($user)
        ->post(route('admin.tesoreria.cobros.store'), [
            'sales_document_id' => $document->id,
            'payment_method_id' => $method->id,
            'payment_date' => now()->toDateString(),
            'amount' => 50,
        ])
        ->assertRedirect();

    $payment = TreasuryPayment::query()->first();
    expect($payment->cash_register_session_id)->toBe($session->id);

    $this->actingAs($user)
        ->put(route('admin.tesoreria.sesiones.close', $session), [
            'closing_cash_counted' => 150,
        ])
        ->assertRedirect();

    expect((float) $session->fresh()->expected_cash)->toBe(150.0);
});
