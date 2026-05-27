<?php

use App\Models\Party;
use App\Models\SalesDocument;
use App\Models\TreasuryPayment;
use App\Models\TreasuryPaymentMethod;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->seed(\Database\Seeders\TreasuryPaymentMethodSeeder::class);
});

function treasuryAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('guests cannot access collections index', function () {
    $this->get(route('admin.tesoreria.cobros.index'))
        ->assertRedirect(route('login'));
});

test('admin can view collections index', function () {
    $this->actingAs(treasuryAdmin())
        ->get(route('admin.tesoreria.cobros.index'))
        ->assertOk();
});

test('full collection marks sales document as paid', function () {
    $customer = Party::factory()->customer()->create();
    $document = SalesDocument::factory()
        ->confirmed()
        ->create([
            'customer_party_id' => $customer->id,
            'total' => 118.00,
            'subtotal' => 100,
            'tax_amount' => 18,
            'payment_status' => SalesDocument::PAYMENT_UNPAID,
        ]);

    $method = TreasuryPaymentMethod::query()->where('code', 'cash')->firstOrFail();

    $this->actingAs(treasuryAdmin())
        ->post(route('admin.tesoreria.cobros.store'), [
            'sales_document_id' => $document->id,
            'payment_method_id' => $method->id,
            'payment_date' => now()->toDateString(),
            'amount' => 118,
            'reference' => 'REC-001',
        ])
        ->assertRedirect(route('admin.tesoreria.cobros.index'));

    expect(TreasuryPayment::query()->count())->toBe(1)
        ->and($document->fresh()->payment_status)->toBe(SalesDocument::PAYMENT_PAID);
});

test('partial collection updates payment status', function () {
    $document = SalesDocument::factory()
        ->confirmed()
        ->create([
            'total' => 200,
            'payment_status' => SalesDocument::PAYMENT_UNPAID,
        ]);

    $method = TreasuryPaymentMethod::query()->where('code', 'transfer')->firstOrFail();

    $this->actingAs(treasuryAdmin())
        ->post(route('admin.tesoreria.cobros.store'), [
            'sales_document_id' => $document->id,
            'payment_method_id' => $method->id,
            'payment_date' => now()->toDateString(),
            'amount' => 50,
        ])
        ->assertRedirect(route('admin.tesoreria.cobros.index'));

    expect($document->fresh()->payment_status)->toBe(SalesDocument::PAYMENT_PARTIAL);
});

test('collection cannot exceed balance due', function () {
    $document = SalesDocument::factory()
        ->confirmed()
        ->create([
            'total' => 100,
            'payment_status' => SalesDocument::PAYMENT_UNPAID,
        ]);

    $method = TreasuryPaymentMethod::query()->where('code', 'cash')->firstOrFail();

    $this->actingAs(treasuryAdmin())
        ->post(route('admin.tesoreria.cobros.store'), [
            'sales_document_id' => $document->id,
            'payment_method_id' => $method->id,
            'payment_date' => now()->toDateString(),
            'amount' => 150,
        ])
        ->assertSessionHasErrors('amount');

    expect(TreasuryPayment::query()->count())->toBe(0);
});

test('collection from internal ticket redirects to tickets index', function () {
    $document = SalesDocument::factory()
        ->internal()
        ->confirmed()
        ->create([
            'total' => 45.50,
            'payment_status' => SalesDocument::PAYMENT_UNPAID,
        ]);

    $method = TreasuryPaymentMethod::query()->where('code', 'cash')->firstOrFail();

    $this->actingAs(treasuryAdmin())
        ->post(route('admin.tesoreria.cobros.store'), [
            'sales_document_id' => $document->id,
            'payment_method_id' => $method->id,
            'payment_date' => now()->toDateString(),
            'amount' => 45.50,
            'redirect' => 'internal_sales_index',
        ])
        ->assertRedirect(route('admin.ventas.tickets-internos.index'));

    expect($document->fresh()->payment_status)->toBe(SalesDocument::PAYMENT_PAID);
});

test('draft document cannot be collected', function () {
    $document = SalesDocument::factory()->create([
        'status' => SalesDocument::STATUS_DRAFT,
        'total' => 50,
    ]);

    $method = TreasuryPaymentMethod::query()->where('code', 'cash')->firstOrFail();

    $this->actingAs(treasuryAdmin())
        ->post(route('admin.tesoreria.cobros.store'), [
            'sales_document_id' => $document->id,
            'payment_method_id' => $method->id,
            'payment_date' => now()->toDateString(),
            'amount' => 50,
        ])
        ->assertSessionHasErrors('amount');
});
