<?php

use App\Jobs\EmitElectronicDocumentJob;
use App\Models\ElectronicDocument;
use App\Models\SalesDocument;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('guest cannot access electronic documents index', function () {
    $this->get(route('admin.documentos.comprobantes-electronicos.index'))
        ->assertRedirect(route('login'));
});

test('user without permission gets 403 on index', function () {
    $user = User::factory()->create();
    $user->assignRole('warehouse');

    $this->actingAs($user)
        ->get(route('admin.documentos.comprobantes-electronicos.index'))
        ->assertForbidden();
});

test('sales user can list electronic documents', function () {
    $user = User::factory()->create();
    $user->assignRole('sales');

    $sale = SalesDocument::factory()->confirmed()->create();
    ElectronicDocument::factory()->create([
        'sales_document_id' => $sale->id,
        'status' => ElectronicDocument::STATUS_ACCEPTED,
    ]);

    $this->actingAs($user)
        ->get(route('admin.documentos.comprobantes-electronicos.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/documentos/comprobantes-electronicos/index')
            ->has('documents', 1)
            ->where('documents.0.status', ElectronicDocument::STATUS_ACCEPTED));
});

test('admin can reemit rejected electronic document', function () {
    Queue::fake();

    $user = User::factory()->create();
    $user->assignRole('admin');

    $electronic = ElectronicDocument::factory()->create([
        'status' => ElectronicDocument::STATUS_REJECTED,
        'sunat_description' => 'Error previo',
    ]);

    $this->actingAs($user)
        ->post(route('admin.documentos.comprobantes-electronicos.reemit', $electronic))
        ->assertRedirect();

    $electronic->refresh();

    expect($electronic->status)->toBe(ElectronicDocument::STATUS_PENDING)
        ->and($electronic->sunat_description)->toBeNull();

    Queue::assertPushed(EmitElectronicDocumentJob::class);
});

test('sales user cannot reemit without manage permission', function () {
    $user = User::factory()->create();
    $user->assignRole('sales');

    $electronic = ElectronicDocument::factory()->create([
        'status' => ElectronicDocument::STATUS_REJECTED,
    ]);

    $this->actingAs($user)
        ->post(route('admin.documentos.comprobantes-electronicos.reemit', $electronic))
        ->assertForbidden();
});
