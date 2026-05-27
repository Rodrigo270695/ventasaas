<?php

use App\Models\PurchaseDocument;
use App\Models\TreasuryPayment;
use App\Models\TreasuryPaymentMethod;
use App\Models\User;
use Illuminate\Http\UploadedFile;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('admin can record disbursement against purchase document', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $document = PurchaseDocument::factory()->create([
        'total' => 118,
        'payment_status' => PurchaseDocument::PAYMENT_UNPAID,
    ]);

    $method = TreasuryPaymentMethod::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->post(route('admin.tesoreria.pagos-proveedor.store'), [
            'purchase_document_id' => $document->id,
            'payment_method_id' => $method->id,
            'payment_date' => now()->toDateString(),
            'amount' => 118,
            'redirect' => 'payables_index',
        ])
        ->assertRedirect(route('admin.tesoreria.cuentas-por-pagar.index'));

    $document->refresh();

    expect($document->payment_status)->toBe(PurchaseDocument::PAYMENT_PAID);
});

test('admin can record disbursement with proof file', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $document = PurchaseDocument::factory()->create([
        'total' => 50,
        'payment_status' => PurchaseDocument::PAYMENT_UNPAID,
    ]);

    $method = TreasuryPaymentMethod::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->post(route('admin.tesoreria.pagos-proveedor.store'), [
            'purchase_document_id' => $document->id,
            'payment_method_id' => $method->id,
            'payment_date' => now()->toDateString(),
            'amount' => 50,
            'proof_file' => UploadedFile::fake()->create('voucher.pdf', 100, 'application/pdf'),
        ])
        ->assertRedirect(route('admin.tesoreria.cuentas-por-pagar.index'));

    $payment = TreasuryPayment::query()->first();

    expect($payment?->proof_file_path)->not->toBeNull();
});

test('admin can update disbursement to attach proof file', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $document = PurchaseDocument::factory()->create([
        'total' => 100,
        'payment_status' => PurchaseDocument::PAYMENT_PARTIAL,
    ]);

    $method = TreasuryPaymentMethod::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->post(route('admin.tesoreria.pagos-proveedor.store'), [
            'purchase_document_id' => $document->id,
            'payment_method_id' => $method->id,
            'payment_date' => now()->toDateString(),
            'amount' => 40,
        ]);

    $payment = TreasuryPayment::query()->first();

    expect($payment?->proof_file_path)->toBeNull();

    $this->actingAs($user)
        ->patch(route('admin.tesoreria.pagos-proveedor.update', $payment), [
            'reference' => 'OP-12345',
            'notes' => 'Comprobante tardío',
            'proof_file' => UploadedFile::fake()->create('voucher.jpg', 100, 'image/jpeg'),
        ])
        ->assertRedirect();

    $payment->refresh();

    expect($payment->reference)->toBe('OP-12345')
        ->and($payment->notes)->toBe('Comprobante tardío')
        ->and($payment->proof_file_path)->not->toBeNull();
});
