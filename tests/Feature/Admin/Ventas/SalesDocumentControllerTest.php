<?php

use App\Models\DocumentSeries;
use App\Models\Party;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductVariant;
use App\Models\SalesDocument;
use App\Models\StockBalance;
use App\Models\TreasuryPayment;
use App\Models\TreasuryPaymentMethod;
use App\Models\User;
use App\Models\Warehouse;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->seed(\Database\Seeders\DocumentSeriesSeeder::class);
});

test('guests cannot access sales documents index', function () {
    $this->get(route('admin.ventas.comprobantes.index'))
        ->assertRedirect(route('login'));
});

test('admin can create a draft sales document', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $series = DocumentSeries::query()->where('series', 'F001')->firstOrFail();
    $customer = Party::factory()->customer()->create();
    $warehouse = Warehouse::factory()->create(['is_saleable' => true]);

    $product = Product::factory()->create(['track_stock' => true]);
    $variant = ProductVariant::factory()->for($product)->create();
    $priceList = \App\Models\PriceList::factory()->create(['is_default' => true]);
    ProductPrice::factory()->create([
        'product_variant_id' => $variant->id,
        'price_list_id' => $priceList->id,
        'amount' => 100,
    ]);

    StockBalance::query()->create([
        'warehouse_id' => $warehouse->id,
        'product_variant_id' => $variant->id,
        'quantity_on_hand' => 10,
        'quantity_reserved' => 0,
        'avg_cost' => 50,
    ]);

    $response = $this->actingAs($user)
        ->post(route('admin.ventas.comprobantes.store'), [
            'document_series_id' => $series->id,
            'customer_party_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'issue_date' => now()->toDateString(),
            'currency_code' => 'PEN',
            'exchange_rate' => 1,
            'global_discount' => 0,
            'lines' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 2,
                    'unit_price' => 100,
                    'discount' => 0,
                ],
            ],
        ]);

    $document = SalesDocument::query()->first();
    expect($document)->not->toBeNull()
        ->and($document->status)->toBe(SalesDocument::STATUS_DRAFT)
        ->and($document->lines)->toHaveCount(1);

    $response->assertRedirect(route('admin.ventas.comprobantes.edit', $document));
});

test('admin can confirm a draft and reserve document number', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $series = DocumentSeries::query()->where('series', 'B001')->firstOrFail();
    $nextBefore = (int) $series->next_number;
    $customer = Party::factory()->customer()->create();

    $document = SalesDocument::factory()->create([
        'document_series_id' => $series->id,
        'sunat_document_type_code' => $series->sunat_document_type_code,
        'series' => $series->series,
        'customer_party_id' => $customer->id,
        'status' => SalesDocument::STATUS_DRAFT,
    ]);

    $product = Product::factory()->create(['track_stock' => false, 'type' => Product::TYPE_SERVICE]);
    $variant = ProductVariant::factory()->for($product)->create();

    $document->lines()->create([
        'product_variant_id' => $variant->id,
        'quantity' => 1,
        'unit_price' => 50,
        'discount' => 0,
        'tax_affectation_code' => '10',
        'igv_rate' => 0.18,
        'line_subtotal' => 50,
        'igv_amount' => 9,
        'line_total' => 59,
        'line_order' => 0,
    ]);

    $document->update(['subtotal' => 50, 'tax_amount' => 9, 'total' => 59]);

    $this->actingAs($user)
        ->post(route('admin.ventas.comprobantes.confirm', $document), [
            'document_series_id' => $series->id,
            'customer_party_id' => $customer->id,
            'issue_date' => now()->toDateString(),
            'currency_code' => 'PEN',
            'exchange_rate' => 1,
            'global_discount' => 0,
            'lines' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 1,
                    'unit_price' => 50,
                    'discount' => 0,
                ],
            ],
        ])
        ->assertRedirect(route('admin.ventas.comprobantes.edit', [
            'comprobante' => $document,
            'imprimir' => 1,
        ]));

    $document->refresh();
    $series->refresh();

    expect($document->status)->toBe(SalesDocument::STATUS_CONFIRMED)
        ->and($document->number)->toBe($nextBefore)
        ->and($document->full_number)->toContain('B001-')
        ->and($series->next_number)->toBe($nextBefore + 1);
});

test('confirm with record_payment confirms document and registers collection', function () {
    $this->seed(\Database\Seeders\TreasuryPaymentMethodSeeder::class);

    $user = User::factory()->create();
    $user->assignRole('admin');

    $series = DocumentSeries::query()->where('series', 'TI01')->firstOrFail();
    $warehouse = Warehouse::factory()->create(['is_saleable' => true]);

    $product = Product::factory()->create(['track_stock' => false]);
    $variant = ProductVariant::factory()->for($product)->create();

    $document = SalesDocument::factory()->create([
        'document_series_id' => $series->id,
        'sunat_document_type_code' => $series->sunat_document_type_code,
        'series' => $series->series,
        'warehouse_id' => $warehouse->id,
        'is_internal' => true,
        'status' => SalesDocument::STATUS_DRAFT,
        'customer_party_id' => null,
    ]);

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

    $method = TreasuryPaymentMethod::query()->where('code', 'cash')->firstOrFail();

    $payload = [
        'document_series_id' => $series->id,
        'customer_party_id' => null,
        'warehouse_id' => $warehouse->id,
        'issue_date' => now()->toDateString(),
        'currency_code' => 'PEN',
        'exchange_rate' => 1,
        'global_discount' => 0,
        'lines' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 1,
                'unit_price' => 10,
                'discount' => 0,
            ],
        ],
        'record_payment' => true,
        'payment_method_id' => $method->id,
        'payment_date' => now()->toDateString(),
        'amount' => 10,
    ];

    $this->actingAs($user)
        ->post(route('admin.ventas.tickets-internos.confirm', $document), $payload)
        ->assertRedirect(route('admin.ventas.tickets-internos.edit', [
            'comprobante' => $document,
            'imprimir' => 1,
        ]));

    $document->refresh();

    expect($document->status)->toBe(SalesDocument::STATUS_CONFIRMED)
        ->and($document->payment_status)->toBe(SalesDocument::PAYMENT_PAID)
        ->and(TreasuryPayment::query()->count())->toBe(1);
});

test('confirm saves current form lines before reserving number', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $series = DocumentSeries::query()->where('series', 'B001')->firstOrFail();
    $customer = Party::factory()->customer()->create();
    $warehouse = Warehouse::factory()->create(['is_saleable' => true, 'code' => 'VENTA-TEST']);

    $oldProduct = Product::factory()->create(['track_stock' => true]);
    $oldVariant = ProductVariant::factory()->for($oldProduct)->create(['sku' => 'OLD-SKU']);

    $newProduct = Product::factory()->create(['track_stock' => true]);
    $newVariant = ProductVariant::factory()->for($newProduct)->create(['sku' => 'NEW-SKU']);

    StockBalance::query()->create([
        'warehouse_id' => $warehouse->id,
        'product_variant_id' => $newVariant->id,
        'quantity_on_hand' => 5,
        'quantity_reserved' => 0,
        'avg_cost' => 1,
    ]);

    $document = SalesDocument::factory()->create([
        'document_series_id' => $series->id,
        'sunat_document_type_code' => $series->sunat_document_type_code,
        'series' => $series->series,
        'customer_party_id' => $customer->id,
        'warehouse_id' => $warehouse->id,
        'status' => SalesDocument::STATUS_DRAFT,
    ]);

    $document->lines()->create([
        'product_variant_id' => $oldVariant->id,
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

    $this->actingAs($user)
        ->post(route('admin.ventas.comprobantes.confirm', $document), [
            'document_series_id' => $series->id,
            'customer_party_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'issue_date' => now()->toDateString(),
            'currency_code' => 'PEN',
            'exchange_rate' => 1,
            'global_discount' => 0,
            'lines' => [
                [
                    'product_variant_id' => $newVariant->id,
                    'quantity' => 1,
                    'unit_price' => 10,
                    'discount' => 0,
                ],
            ],
        ])
        ->assertRedirect(route('admin.ventas.comprobantes.edit', [
            'comprobante' => $document,
            'imprimir' => 1,
        ]));

    $document->refresh()->load('lines');

    expect($document->status)->toBe(SalesDocument::STATUS_CONFIRMED)
        ->and($document->lines)->toHaveCount(1)
        ->and($document->lines->first()->product_variant_id)->toBe($newVariant->id);
});

test('admin can sell from a non-saleable warehouse when stock exists there', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $series = DocumentSeries::query()->where('series', 'B001')->firstOrFail();
    $customer = Party::factory()->customer()->create();
    $bodega = Warehouse::factory()->create([
        'code' => 'BODEGA-TEST',
        'is_saleable' => false,
        'is_default' => false,
    ]);

    $product = Product::factory()->create(['track_stock' => true]);
    $variant = ProductVariant::factory()->for($product)->create();
    $priceList = \App\Models\PriceList::factory()->create(['is_default' => true]);
    ProductPrice::factory()->create([
        'product_variant_id' => $variant->id,
        'price_list_id' => $priceList->id,
        'amount' => 25,
    ]);

    StockBalance::query()->create([
        'warehouse_id' => $bodega->id,
        'product_variant_id' => $variant->id,
        'quantity_on_hand' => 20,
        'quantity_reserved' => 0,
        'avg_cost' => 10,
    ]);

    $this->actingAs($user)
        ->post(route('admin.ventas.comprobantes.store'), [
            'document_series_id' => $series->id,
            'customer_party_id' => $customer->id,
            'warehouse_id' => $bodega->id,
            'issue_date' => now()->toDateString(),
            'currency_code' => 'PEN',
            'exchange_rate' => 1,
            'global_discount' => 0,
            'lines' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 3,
                    'unit_price' => 25,
                    'discount' => 0,
                ],
            ],
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $document = SalesDocument::query()->latest()->first();
    expect($document)->not->toBeNull()
        ->and($document->warehouse_id)->toBe($bodega->id);

    $this->actingAs($user)
        ->post(route('admin.ventas.comprobantes.confirm', $document), [
            'document_series_id' => $series->id,
            'customer_party_id' => $customer->id,
            'warehouse_id' => $bodega->id,
            'issue_date' => now()->toDateString(),
            'currency_code' => 'PEN',
            'exchange_rate' => 1,
            'global_discount' => 0,
            'lines' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 3,
                    'unit_price' => 25,
                    'discount' => 0,
                ],
            ],
        ])
        ->assertRedirect(route('admin.ventas.comprobantes.edit', [
            'comprobante' => $document,
            'imprimir' => 1,
        ]));

    $balance = StockBalance::query()
        ->where('warehouse_id', $bodega->id)
        ->where('product_variant_id', $variant->id)
        ->first();

    expect($document->fresh()->status)->toBe(SalesDocument::STATUS_CONFIRMED)
        ->and((float) $balance->quantity_on_hand)->toBe(17.0);
});

test('confirmed sales document can open thermal ticket print page', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $document = SalesDocument::factory()->confirmed()->create([
        'full_number' => 'EB01-00000099',
        'subtotal' => 10,
        'tax_amount' => 1.8,
        'total' => 11.8,
    ]);

    $this->actingAs($user)
        ->get(route('admin.ventas.comprobantes.ticket', [
            'comprobante' => $document,
            'format' => '80mm',
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/ventas/comprobantes/ticket')
            ->where('format', '80mm')
            ->where('document.full_number', 'EB01-00000099')
            ->has('store.logo_url')
        );
});

test('thermal ticket defaults to 58mm format for narrow printers', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $document = SalesDocument::factory()->confirmed()->create([
        'full_number' => 'EB01-00000100',
    ]);

    $this->actingAs($user)
        ->get(route('admin.ventas.comprobantes.ticket', [
            'comprobante' => $document,
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/ventas/comprobantes/ticket')
            ->where('format', '58mm')
        );
});

test('cashier can create and confirm internal ticket without customer', function () {
    $user = User::factory()->create();
    $user->assignRole('cashier');

    $series = DocumentSeries::query()->where('series', 'TI01')->firstOrFail();
    $warehouse = Warehouse::factory()->create(['is_saleable' => true]);

    $product = Product::factory()->create(['track_stock' => false]);
    $variant = ProductVariant::factory()->for($product)->create();
    $priceList = \App\Models\PriceList::factory()->create(['is_default' => true]);
    ProductPrice::factory()->create([
        'product_variant_id' => $variant->id,
        'price_list_id' => $priceList->id,
        'amount' => 5,
    ]);

    $payload = [
        'document_series_id' => $series->id,
        'customer_party_id' => null,
        'warehouse_id' => $warehouse->id,
        'issue_date' => now()->toDateString(),
        'currency_code' => 'PEN',
        'exchange_rate' => 1,
        'global_discount' => 0,
        'lines' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 1,
                'unit_price' => 5,
                'discount' => 0,
            ],
        ],
    ];

    $this->actingAs($user)
        ->post(route('admin.ventas.tickets-internos.store'), $payload)
        ->assertRedirect();

    $document = SalesDocument::query()->first();
    expect($document)->not->toBeNull()
        ->and($document->is_internal)->toBeTrue()
        ->and($document->customer_party_id)->toBeNull();

    $this->actingAs($user)
        ->post(route('admin.ventas.tickets-internos.confirm', $document), $payload)
        ->assertRedirect();

    expect($document->fresh())
        ->status->toBe(SalesDocument::STATUS_CONFIRMED)
        ->full_number->toStartWith('TI01-')
        ->electronicDocument->toBeNull();
});

test('fiscal store rejects internal document series', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $series = DocumentSeries::query()->where('series', 'TI01')->firstOrFail();
    $customer = Party::factory()->customer()->create();
    $warehouse = Warehouse::factory()->create(['is_saleable' => true]);
    $variant = ProductVariant::factory()->create();

    $this->actingAs($user)
        ->post(route('admin.ventas.comprobantes.store'), [
            'document_series_id' => $series->id,
            'customer_party_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'issue_date' => now()->toDateString(),
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
        ->assertSessionHasErrors('document_series_id');
});

test('draft sales document cannot open ticket print page', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $document = SalesDocument::factory()->create([
        'status' => SalesDocument::STATUS_DRAFT,
    ]);

    $this->actingAs($user)
        ->get(route('admin.ventas.comprobantes.ticket', $document))
        ->assertNotFound();
});
