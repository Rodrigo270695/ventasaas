<?php

use App\Mail\SalesQuotationMail;
use App\Models\Party;
use App\Models\SalesQuotation;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

test('admin can create quotation with manual line', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $customer = Party::factory()->customer()->create();

    $this->actingAs($user)
        ->post(route('admin.ventas.cotizaciones.store'), [
            'customer_party_id' => $customer->id,
            'issue_date' => now()->toDateTimeString(),
            'valid_until' => now()->addWeek()->toDateString(),
            'currency_code' => 'PEN',
            'exchange_rate' => 1,
            'global_discount' => 0,
            'notes' => 'Línea manual de prueba',
            'lines' => [
                [
                    'product_variant_id' => null,
                    'manual_sku' => 'MNL-001',
                    'description' => 'Servicio de instalación',
                    'quantity' => 2,
                    'unit_price' => 50,
                    'discount' => 0,
                ],
            ],
        ])
        ->assertRedirect();

    $quotation = SalesQuotation::query()->firstOrFail();
    $line = $quotation->lines()->firstOrFail();

    expect($quotation->internal_number)->toStartWith('COT-')
        ->and($line->product_variant_id)->toBeNull()
        ->and($line->manual_sku)->toBe('MNL-001')
        ->and($line->description)->toBe('Servicio de instalación');
});

test('admin can send quotation by email', function () {
    Mail::fake();

    $user = User::factory()->create();
    $user->assignRole('admin');

    $customer = Party::factory()->customer()->create();

    $quotation = SalesQuotation::query()->create([
        'internal_number' => 'COT-2026-000001',
        'customer_party_id' => $customer->id,
        'issue_date' => now(),
        'currency_code' => 'PEN',
        'exchange_rate' => 1,
        'subtotal' => 100,
        'tax_amount' => 18,
        'total' => 118,
        'global_discount' => 0,
        'status' => SalesQuotation::STATUS_DRAFT,
        'created_by' => $user->id,
    ]);

    $quotation->lines()->create([
        'product_variant_id' => null,
        'manual_sku' => 'MNL-001',
        'description' => 'Servicio de instalación',
        'quantity' => 1,
        'unit_price' => 118,
        'discount' => 0,
        'tax_affectation_code' => '10',
        'igv_rate' => 0.18,
        'line_subtotal' => 100,
        'igv_amount' => 18,
        'line_total' => 118,
        'line_order' => 0,
    ]);

    $this->actingAs($user)
        ->from(route('admin.ventas.cotizaciones.edit', $quotation))
        ->post(route('admin.ventas.cotizaciones.send-email', $quotation), [
            'to_email' => 'cliente@test.com',
            'cc_emails' => 'ventas@test.com',
        ])
        ->assertRedirect(route('admin.ventas.cotizaciones.edit', $quotation));

    $quotation->refresh();

    expect($quotation->customer_email_to)->toBe('cliente@test.com')
        ->and($quotation->customer_email_sent_at)->not->toBeNull()
        ->and($quotation->status)->toBe(SalesQuotation::STATUS_SENT);

    Mail::assertSent(SalesQuotationMail::class, function (SalesQuotationMail $mail) {
        $attachments = $mail->attachments();

        return $mail->hasTo('cliente@test.com')
            && count($attachments) === 1;
    });
});

test('admin can view quotation pdf', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');

    $customer = Party::factory()->customer()->create();

    $quotation = SalesQuotation::query()->create([
        'internal_number' => 'COT-2026-000099',
        'customer_party_id' => $customer->id,
        'issue_date' => now(),
        'currency_code' => 'PEN',
        'exchange_rate' => 1,
        'subtotal' => 100,
        'tax_amount' => 18,
        'total' => 118,
        'global_discount' => 0,
        'status' => SalesQuotation::STATUS_DRAFT,
        'created_by' => $user->id,
    ]);

    $quotation->lines()->create([
        'product_variant_id' => null,
        'manual_sku' => 'MNL-001',
        'description' => 'Servicio de instalación',
        'quantity' => 1,
        'unit_price' => 118,
        'discount' => 0,
        'tax_affectation_code' => '10',
        'igv_rate' => 0.18,
        'line_subtotal' => 100,
        'igv_amount' => 18,
        'line_total' => 118,
        'line_order' => 0,
    ]);

    $this->actingAs($user)
        ->get(route('admin.ventas.cotizaciones.print', $quotation))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

