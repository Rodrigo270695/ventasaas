<?php

use App\Models\Party;
use App\Models\PurchaseDocument;
use App\Models\TreasuryPaymentMethod;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('guests cannot access accounts payable index', function () {
    $this->get(route('admin.tesoreria.cuentas-por-pagar.index'))
        ->assertRedirect(route('login'));
});

test('admin can view accounts payable with open balances', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $supplier = Party::factory()->supplier()->create();

    $open = PurchaseDocument::factory()->create([
        'supplier_party_id' => $supplier->id,
        'total' => 118,
        'payment_status' => PurchaseDocument::PAYMENT_UNPAID,
        'due_date' => now()->subDays(5),
    ]);

    PurchaseDocument::factory()->create([
        'total' => 50,
        'payment_status' => PurchaseDocument::PAYMENT_PAID,
    ]);

    $this->actingAs($user)
        ->get(route('admin.tesoreria.cuentas-por-pagar.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/tesoreria/cuentas-por-pagar/index')
            ->has('documents', 1)
            ->where('documents.0.id', $open->id)
            ->where('documents.0.is_overdue', true)
        );
});

test('accounts payable lists documents by issue date descending', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $older = PurchaseDocument::factory()->create([
        'issue_date' => now()->subDays(2),
        'total' => 100,
        'payment_status' => PurchaseDocument::PAYMENT_UNPAID,
    ]);

    $newer = PurchaseDocument::factory()->create([
        'issue_date' => now()->subHour(),
        'total' => 80,
        'payment_status' => PurchaseDocument::PAYMENT_UNPAID,
    ]);

    $this->actingAs($user)
        ->get(route('admin.tesoreria.cuentas-por-pagar.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('documents', 2)
            ->where('documents.0.id', $newer->id)
            ->where('documents.1.id', $older->id)
        );
});

test('accounts payable can filter overdue documents', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $overdue = PurchaseDocument::factory()->create([
        'total' => 100,
        'payment_status' => PurchaseDocument::PAYMENT_UNPAID,
        'due_date' => now()->subDay(),
    ]);

    PurchaseDocument::factory()->create([
        'total' => 80,
        'payment_status' => PurchaseDocument::PAYMENT_UNPAID,
        'due_date' => now()->addWeek(),
    ]);

    $this->actingAs($user)
        ->get(route('admin.tesoreria.cuentas-por-pagar.index', ['aging' => 'overdue']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('documents', 1)
            ->where('documents.0.id', $overdue->id)
        );
});
