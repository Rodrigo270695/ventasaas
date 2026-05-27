<?php

use App\Jobs\EmitElectronicDocumentJob;
use App\Models\CfgStoreSetting;
use App\Models\DocumentSeries;
use App\Models\ElectronicDocument;
use App\Models\Party;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SalesDocument;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->seed(\Database\Seeders\DocumentSeriesSeeder::class);
});

test('confirming electronic series creates electronic document and dispatches job', function () {
    Queue::fake();

    $user = User::factory()->create();
    $user->assignRole('admin');

    $series = DocumentSeries::query()->where('series', 'B001')->firstOrFail();

    $document = SalesDocument::factory()->create([
        'document_series_id' => $series->id,
        'sunat_document_type_code' => $series->sunat_document_type_code,
        'series' => $series->series,
        'status' => SalesDocument::STATUS_DRAFT,
    ]);

    $variant = ProductVariant::factory()
        ->for(Product::factory()->create(['track_stock' => false, 'type' => Product::TYPE_SERVICE]))
        ->create();

    $document->lines()->create([
        'product_variant_id' => $variant->id,
        'quantity' => 1,
        'unit_price' => 10,
        'discount' => 0,
        'tax_affectation_code' => '10',
        'igv_rate' => 0.18,
        'line_subtotal' => 8.47,
        'igv_amount' => 1.53,
        'line_total' => 10,
        'line_order' => 0,
    ]);

    $document->update(['subtotal' => 8.47, 'tax_amount' => 1.53, 'total' => 10]);

    $customer = Party::factory()->create([
        'type' => Party::TYPE_CUSTOMER,
        'document_type' => Party::DOC_DNI,
    ]);

    $this->actingAs($user)
        ->post(route('admin.ventas.comprobantes.confirm', $document), [
            'document_series_id' => $series->id,
            'customer_party_id' => $customer->id,
            'issue_date' => $document->issue_date->format('Y-m-d'),
            'currency_code' => 'PEN',
            'exchange_rate' => 1,
            'lines' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 1,
                    'unit_price' => 10,
                    'discount' => 0,
                ],
            ],
        ])
        ->assertRedirect();

    $electronic = ElectronicDocument::query()
        ->where('sales_document_id', $document->id)
        ->first();

    expect($electronic)->not->toBeNull()
        ->and($electronic->status)->toBe(ElectronicDocument::STATUS_PENDING)
        ->and($electronic->gateway)->toBe(ElectronicDocument::GATEWAY_SUNAT_SOAP);

    Queue::assertPushed(EmitElectronicDocumentJob::class, function (EmitElectronicDocumentJob $job) use ($electronic) {
        return $job->electronicDocumentId === $electronic->id;
    });
});

test('electronic emission job accepts document when fake mode enabled', function () {
    config(['electronic_billing.fake_accept' => true]);

    CfgStoreSetting::factory()->create([
        'ruc' => '20123456789',
        'razon_social' => 'Demo SAC',
        'ubigeo' => '150101',
    ]);

    $series = DocumentSeries::query()->where('series', 'F001')->firstOrFail();

    $document = SalesDocument::factory()->confirmed()->create([
        'document_series_id' => $series->id,
        'sunat_document_type_code' => $series->sunat_document_type_code,
        'series' => $series->series,
        'full_number' => 'F001-00000001',
        'number' => 1,
    ]);

    $electronic = ElectronicDocument::factory()->create([
        'sales_document_id' => $document->id,
        'status' => ElectronicDocument::STATUS_PENDING,
    ]);

    (new EmitElectronicDocumentJob($electronic->id))->handle(
        app(\App\Services\ElectronicBilling\ElectronicDocumentEmitter::class),
    );

    $electronic->refresh();

    expect($electronic->status)->toBe(ElectronicDocument::STATUS_ACCEPTED)
        ->and($electronic->sunat_response_code)->toBe('0')
        ->and($electronic->accepted_at)->not->toBeNull();
});

test('electronic emission rejects when store certificate is missing', function () {
    config(['electronic_billing.fake_accept' => false]);

    CfgStoreSetting::factory()->create([
        'ruc' => '20123456789',
        'razon_social' => 'Demo SAC',
        'ubigeo' => '150101',
        'cdt_path_enc' => null,
        'cdt_password_enc' => null,
    ]);

    $document = SalesDocument::factory()->confirmed()->create([
        'full_number' => 'B001-00000001',
    ]);

    $electronic = ElectronicDocument::factory()->create([
        'sales_document_id' => $document->id,
    ]);

    (new EmitElectronicDocumentJob($electronic->id))->handle(
        app(\App\Services\ElectronicBilling\ElectronicDocumentEmitter::class),
    );

    $electronic->refresh();

    expect($electronic->status)->toBe(ElectronicDocument::STATUS_REJECTED)
        ->and($electronic->sunat_response_code)->toBe('CDT');
});

test('electronic emission rejects when sol credentials are missing', function () {
    config(['electronic_billing.fake_accept' => false]);

    CfgStoreSetting::factory()->create([
        'ruc' => '20123456789',
        'razon_social' => 'Demo SAC',
        'ubigeo' => '150101',
        'cdt_path_enc' => 'store/cert.pem',
        'cdt_password_enc' => 'secret-cert',
        'sol_user' => null,
        'sol_password_enc' => null,
    ]);

    $document = SalesDocument::factory()->confirmed()->create([
        'full_number' => 'B001-00000001',
    ]);

    $electronic = ElectronicDocument::factory()->create([
        'sales_document_id' => $document->id,
    ]);

    (new EmitElectronicDocumentJob($electronic->id))->handle(
        app(\App\Services\ElectronicBilling\ElectronicDocumentEmitter::class),
    );

    $electronic->refresh();

    expect($electronic->status)->toBe(ElectronicDocument::STATUS_REJECTED)
        ->and($electronic->sunat_response_code)->toBe('SOL');
});
