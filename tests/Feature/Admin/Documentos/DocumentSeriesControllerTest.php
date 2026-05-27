<?php

use App\Models\DocumentSeries;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('guests cannot access document series index', function () {
    $this->get(route('admin.documentos.series.index'))
        ->assertRedirect(route('login'));
});

test('admin can create document series', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user)
        ->post(route('admin.documentos.series.store'), [
            'sunat_document_type_code' => DocumentSeries::DOC_INVOICE,
            'series' => 'F002',
            'name' => 'Factura secundaria',
            'is_electronic' => true,
            'next_number' => 100,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.documentos.series.index'));

    expect(DocumentSeries::query()->where('series', 'F002')->exists())->toBeTrue();
});

test('document series must be unique per sunat type', function () {
    DocumentSeries::factory()->invoice()->create(['series' => 'F001']);

    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user)
        ->from(route('admin.documentos.series.index'))
        ->post(route('admin.documentos.series.store'), [
            'sunat_document_type_code' => DocumentSeries::DOC_INVOICE,
            'series' => 'F001',
            'next_number' => 1,
            'is_electronic' => true,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.documentos.series.index'))
        ->assertSessionHasErrors('series');
});

test('document series service reserves next number', function () {
    $series = DocumentSeries::factory()->ticket()->create([
        'series' => 'B099',
        'next_number' => 5,
    ]);

    $service = app(\App\Services\Documents\DocumentSeriesService::class);

    expect($service->reserveNext($series))->toBe(5);
    expect($service->reserveNext($series->fresh()))->toBe(6);
});
