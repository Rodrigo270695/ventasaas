<?php

use App\Models\Party;
use App\Models\SalesDocument;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('guests cannot access accounts receivable index', function () {
    $this->get(route('admin.tesoreria.cuentas-por-cobrar.index'))
        ->assertRedirect(route('login'));
});

test('admin can view accounts receivable with open balances', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $customer = Party::factory()->customer()->create();

    $open = SalesDocument::factory()
        ->confirmed()
        ->create([
            'customer_party_id' => $customer->id,
            'total' => 118,
            'payment_status' => SalesDocument::PAYMENT_UNPAID,
            'due_date' => now()->subDays(5),
        ]);

    SalesDocument::factory()
        ->confirmed()
        ->create([
            'total' => 50,
            'payment_status' => SalesDocument::PAYMENT_PAID,
        ]);

    $this->actingAs($user)
        ->get(route('admin.tesoreria.cuentas-por-cobrar.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/tesoreria/cuentas-por-cobrar/index')
            ->has('documents', 1)
            ->where('documents.0.id', $open->id)
            ->where('documents.0.is_overdue', true)
        );
});

test('accounts receivable can filter overdue documents', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $overdue = SalesDocument::factory()
        ->confirmed()
        ->create([
            'total' => 100,
            'payment_status' => SalesDocument::PAYMENT_UNPAID,
            'due_date' => now()->subDay(),
        ]);

    SalesDocument::factory()
        ->confirmed()
        ->create([
            'total' => 80,
            'payment_status' => SalesDocument::PAYMENT_UNPAID,
            'due_date' => now()->addWeek(),
        ]);

    $this->actingAs($user)
        ->get(route('admin.tesoreria.cuentas-por-cobrar.index', ['aging' => 'overdue']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('documents', 1)
            ->where('documents.0.id', $overdue->id)
        );
});
