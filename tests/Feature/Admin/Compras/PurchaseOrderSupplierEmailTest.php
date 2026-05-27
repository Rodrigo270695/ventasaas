<?php

use App\Mail\PurchaseOrderSupplierMail;
use App\Models\Party;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\User;
use App\Services\Compras\PurchaseOrderService;
use App\Services\Compras\PurchaseOrderSupplierMailService;
use Illuminate\Support\Facades\Mail;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('admin can send purchase order email to supplier', function () {
    Mail::fake();

    $user = User::factory()->create();
    $user->assignRole('admin');

    $supplier = Party::factory()->create([
        'type' => Party::TYPE_SUPPLIER,
        'email' => null,
    ]);

    $variant = ProductVariant::factory()->create([
        'product_id' => Product::factory()->create()->id,
    ]);

    $order = app(PurchaseOrderService::class)->create([
        'supplier_party_id' => $supplier->id,
        'order_date' => now()->toDateTimeString(),
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

    $this->actingAs($user)
        ->from(route('admin.compras.ordenes.edit', $order))
        ->post(route('admin.compras.ordenes.send-email', $order), [
            'to_email' => 'proveedor@test.com',
            'cc_emails' => 'compras@test.com',
            'save_supplier_email' => true,
        ])
        ->assertRedirect(route('admin.compras.ordenes.edit', $order));

    $order->refresh();

    expect($order->supplier_email_to)->toBe('proveedor@test.com')
        ->and($order->supplier_email_sent_at)->not->toBeNull()
        ->and($order->supplier_confirmation_token)->not->toBeNull()
        ->and($supplier->fresh()->email)->toBe('proveedor@test.com');

    Mail::assertSent(PurchaseOrderSupplierMail::class, function ($mail) {
        return $mail->hasTo('proveedor@test.com');
    });
});

test('supplier can confirm purchase order via public link', function () {
    $supplier = Party::factory()->create(['type' => Party::TYPE_SUPPLIER]);
    $variant = ProductVariant::factory()->create([
        'product_id' => Product::factory()->create()->id,
    ]);

    $order = app(PurchaseOrderService::class)->create([
        'supplier_party_id' => $supplier->id,
        'order_date' => now()->toDateTimeString(),
        'currency_code' => 'PEN',
        'exchange_rate' => 1,
        'lines' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 1,
                'unit_cost' => 5,
            ],
        ],
    ], true);

    Mail::fake();

    $order = app(PurchaseOrderSupplierMailService::class)->send(
        $order,
        'proveedor@test.com',
    );

    $token = $order->supplier_confirmation_token;

    $this->get(route('purchase-order.supplier.confirm', ['token' => $token]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('compras/orden-confirmada')
            ->where('success', true)
        );

    $order->refresh();

    expect($order->supplier_confirmed_at)->not->toBeNull()
        ->and($order->supplier_confirmation_token)->toBeNull();
});
