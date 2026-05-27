<?php

use App\Models\Party;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\Compras\GoodsReceiptService;
use App\Services\Compras\PurchaseDocumentService;
use App\Services\Compras\PurchaseOrderService;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('purchase order flow order receipt invoice', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $supplier = Party::factory()->create(['type' => Party::TYPE_SUPPLIER]);
    $warehouse = Warehouse::factory()->create(['is_active' => true]);
    $product = Product::factory()->create(['track_stock' => true]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

    $orderService = app(PurchaseOrderService::class);
    $order = $orderService->create([
        'supplier_party_id' => $supplier->id,
        'order_date' => now()->toDateString(),
        'currency_code' => 'PEN',
        'exchange_rate' => 1,
        'lines' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 5,
                'unit_cost' => 20,
            ],
        ],
        'created_by' => $user->id,
    ], true);

    expect($order->status)->toBe(PurchaseOrder::STATUS_APPROVED);

    $receipt = app(GoodsReceiptService::class)->create([
        'purchase_order_id' => $order->id,
        'warehouse_id' => $warehouse->id,
        'received_date' => now()->toDateString(),
        'lines' => [
            [
                'purchase_order_line_id' => $order->lines->first()->id,
                'quantity' => 5,
            ],
        ],
        'created_by' => $user->id,
    ]);

    expect($receipt->stock_movement_id)->not->toBeNull();

    $order->refresh();
    expect($order->status)->toBe(PurchaseOrder::STATUS_RECEIVED);

    $invoice = app(PurchaseDocumentService::class)->createConfirmed([
        'goods_receipt_id' => $receipt->id,
        'supplier_party_id' => $supplier->id,
        'issue_date' => now()->toDateString(),
        'supplier_document_number' => 'F001-999',
        'created_by' => $user->id,
    ]);

    expect($invoice->goods_receipt_id)->toBe($receipt->id)
        ->and($invoice->stock_movement_id)->toBeNull()
        ->and($invoice->payment_status)->toBe('unpaid');
});

test('purchase order edit includes purchase flow timeline', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $supplier = Party::factory()->create(['type' => Party::TYPE_SUPPLIER]);
    $warehouse = Warehouse::factory()->create(['is_active' => true]);
    $product = Product::factory()->create(['track_stock' => true]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

    $order = app(PurchaseOrderService::class)->create([
        'supplier_party_id' => $supplier->id,
        'order_date' => now()->toDateString(),
        'currency_code' => 'PEN',
        'exchange_rate' => 1,
        'lines' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 3,
                'unit_cost' => 10,
            ],
        ],
        'created_by' => $user->id,
    ], true);

    $receipt = app(GoodsReceiptService::class)->create([
        'purchase_order_id' => $order->id,
        'warehouse_id' => $warehouse->id,
        'received_date' => now()->toDateString(),
        'lines' => [
            [
                'purchase_order_line_id' => $order->lines->first()->id,
                'quantity' => 3,
            ],
        ],
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('admin.compras.ordenes.edit', $order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('purchaseFlow')
            ->where('purchaseFlow.receipts.0.id', $receipt->id)
            ->where('purchaseFlow.receipts.0.invoice', null)
            ->has('purchaseFlow.receipts.0.create_invoice_url')
        );
});

test('invoice from receipt allows unit cost adjustment only', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $supplier = Party::factory()->create(['type' => Party::TYPE_SUPPLIER]);
    $warehouse = Warehouse::factory()->create(['is_active' => true]);
    $product = Product::factory()->create(['track_stock' => true]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

    $order = app(PurchaseOrderService::class)->create([
        'supplier_party_id' => $supplier->id,
        'order_date' => now()->toDateString(),
        'currency_code' => 'PEN',
        'exchange_rate' => 1,
        'lines' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 2,
                'unit_cost' => 10,
            ],
        ],
        'created_by' => $user->id,
    ], true);

    $receipt = app(GoodsReceiptService::class)->create([
        'purchase_order_id' => $order->id,
        'warehouse_id' => $warehouse->id,
        'received_date' => now()->toDateString(),
        'lines' => [
            [
                'purchase_order_line_id' => $order->lines->first()->id,
                'quantity' => 2,
            ],
        ],
        'created_by' => $user->id,
    ]);

    $receiptLine = $receipt->lines->first();

    $invoice = app(PurchaseDocumentService::class)->createConfirmed([
        'goods_receipt_id' => $receipt->id,
        'supplier_party_id' => $supplier->id,
        'issue_date' => now()->toDateString(),
        'supplier_document_number' => 'F001-100',
        'lines' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => (string) $receiptLine->quantity,
                'unit_cost' => '15.00',
            ],
        ],
        'created_by' => $user->id,
    ]);

    expect((float) $invoice->total)->toBe(30.0);

    expect(fn () => app(PurchaseDocumentService::class)->createConfirmed([
        'goods_receipt_id' => $receipt->id,
        'supplier_party_id' => $supplier->id,
        'issue_date' => now()->toDateString(),
        'lines' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => '99',
                'unit_cost' => '15.00',
            ],
        ],
        'created_by' => $user->id,
    ]))->toThrow(\InvalidArgumentException::class);
});

test('invoice from receipt supports duplicate product variants on separate lines', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $supplier = Party::factory()->create(['type' => Party::TYPE_SUPPLIER]);
    $warehouse = Warehouse::factory()->create(['is_active' => true]);
    $product = Product::factory()->create(['track_stock' => true]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

    $order = app(PurchaseOrderService::class)->create([
        'supplier_party_id' => $supplier->id,
        'order_date' => now()->toDateString(),
        'currency_code' => 'PEN',
        'exchange_rate' => 1,
        'lines' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 5,
                'unit_cost' => 10,
            ],
            [
                'product_variant_id' => $variant->id,
                'quantity' => 4,
                'unit_cost' => 12,
            ],
        ],
        'created_by' => $user->id,
    ], true);

    $orderLines = $order->lines->values();

    $receipt = app(GoodsReceiptService::class)->create([
        'purchase_order_id' => $order->id,
        'warehouse_id' => $warehouse->id,
        'received_date' => now()->toDateString(),
        'lines' => [
            [
                'purchase_order_line_id' => $orderLines[0]->id,
                'quantity' => 5,
            ],
            [
                'purchase_order_line_id' => $orderLines[1]->id,
                'quantity' => 4,
            ],
        ],
        'created_by' => $user->id,
    ]);

    $receipt->load('lines');

    $invoice = app(PurchaseDocumentService::class)->createConfirmed([
        'goods_receipt_id' => $receipt->id,
        'supplier_party_id' => $supplier->id,
        'issue_date' => now()->toDateString(),
        'supplier_document_number' => 'F001-DUP',
        'lines' => $receipt->lines->map(fn ($line) => [
            'goods_receipt_line_id' => $line->id,
            'product_variant_id' => $line->product_variant_id,
            'quantity' => (string) $line->quantity,
            'unit_cost' => $line->id === $receipt->lines[0]->id ? '30' : '40',
        ])->all(),
        'created_by' => $user->id,
    ]);

    expect($invoice->lines)->toHaveCount(2)
        ->and((float) $invoice->total)->toBe(310.0);
});

test('purchase orders index requires permission', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('purchases.view');

    $this->actingAs($user)
        ->get(route('admin.compras.ordenes.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/compras/ordenes/index'));
});
