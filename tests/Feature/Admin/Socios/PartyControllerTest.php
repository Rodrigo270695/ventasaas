<?php

use App\Models\Party;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

function partiesAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('guests cannot access parties index', function () {
    $this->get(route('admin.socios.index'))
        ->assertRedirect(route('login'));
});

test('admin can view parties index', function () {
    $this->actingAs(partiesAdmin())
        ->get(route('admin.socios.index'))
        ->assertOk();
});

test('party can be created', function () {
    $this->actingAs(partiesAdmin())
        ->post(route('admin.socios.store'), [
            'type' => Party::TYPE_CUSTOMER,
            'document_type' => Party::DOC_RUC,
            'document_number' => '20123456789',
            'legal_name' => 'Cliente Demo SAC',
            'trade_name' => 'Demo',
            'email' => 'demo@example.com',
            'phone' => '999888777',
            'credit_limit' => 1500.5,
            'payment_term_days' => 30,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.socios.index'));

    expect(Party::query()->where('document_number', '20123456789')->exists())->toBeTrue();
});

test('party document must be unique per type', function () {
    Party::factory()->create([
        'document_type' => Party::DOC_RUC,
        'document_number' => '20987654321',
    ]);

    $this->actingAs(partiesAdmin())
        ->from(route('admin.socios.index'))
        ->post(route('admin.socios.store'), [
            'type' => Party::TYPE_SUPPLIER,
            'document_type' => Party::DOC_RUC,
            'document_number' => '20987654321',
            'legal_name' => 'Otro proveedor',
            'credit_limit' => 0,
            'payment_term_days' => 0,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.socios.index'))
        ->assertSessionHasErrors('document_number');
});

test('party can be updated', function () {
    $party = Party::factory()->customer()->create(['legal_name' => 'Antes']);

    $this->actingAs(partiesAdmin())
        ->put(route('admin.socios.update', $party), [
            'type' => $party->type,
            'document_type' => $party->document_type,
            'document_number' => $party->document_number,
            'legal_name' => 'Después',
            'trade_name' => $party->trade_name,
            'email' => $party->email,
            'phone' => $party->phone,
            'credit_limit' => $party->credit_limit,
            'payment_term_days' => $party->payment_term_days,
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.socios.index'));

    expect($party->fresh()->legal_name)->toBe('Después');
    expect($party->fresh()->is_active)->toBeFalse();
});

test('party can be deleted', function () {
    $party = Party::factory()->create();

    $this->actingAs(partiesAdmin())
        ->delete(route('admin.socios.destroy', $party))
        ->assertRedirect(route('admin.socios.index'));

    expect(Party::query()->find($party->id))->toBeNull();
});
