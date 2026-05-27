<?php

use App\Models\Party;
use App\Models\ProductVariant;
use App\Models\PurchaseDocument;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Http\UploadedFile;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('guests cannot access purchase documents index', function () {
    $this->get(route('admin.compras.facturas.index'))
        ->assertRedirect(route('login'));
});

test('admin can view purchase documents index', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    PurchaseDocument::factory()->create(['total' => 118]);

    $this->actingAs($user)
        ->get(route('admin.compras.facturas.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/compras/facturas/index')
            ->has('documents', 1)
        );
});

test('admin can create purchase document with lines and stock', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $supplier = Party::factory()->supplier()->create();
    $variant = ProductVariant::factory()->create();
    $warehouse = Warehouse::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->post(route('admin.compras.facturas.store'), [
            'supplier_party_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
            'supplier_document_number' => 'F001-99',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'currency_code' => 'PEN',
            'exchange_rate' => 1,
            'notes' => 'Compra insumos',
            'lines' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 10,
                    'unit_cost' => 11.8,
                ],
            ],
            'invoice_file' => UploadedFile::fake()->create('factura.pdf', 100, 'application/pdf'),
        ])
        ->assertRedirect(route('admin.compras.facturas.index'));

    $document = PurchaseDocument::query()->first();

    expect($document)->not->toBeNull()
        ->and($document->supplier_party_id)->toBe($supplier->id)
        ->and($document->payment_status)->toBe(PurchaseDocument::PAYMENT_UNPAID)
        ->and($document->invoice_file_path)->not->toBeNull()
        ->and($document->stock_movement_id)->not->toBeNull();

    expect($document->lines)->toHaveCount(1);
});

test('admin can quick create variant for purchases', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    Unit::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->postJson(route('admin.compras.variantes-rapidas.store'), [
            'product_name' => 'Producto compra rápida',
            'sku' => 'CPR-001',
            'label' => 'Unidad',
        ])
        ->assertOk()
        ->assertJsonPath('variant.sublabel', 'CPR-001');
});

test('admin can edit purchase document form', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $document = PurchaseDocument::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.compras.facturas.edit', $document))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/compras/facturas/form')
            ->where('document.id', $document->id)
        );
});
