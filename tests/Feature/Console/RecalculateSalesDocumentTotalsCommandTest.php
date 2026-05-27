<?php

use App\Models\Product;
use App\Models\ProductTaxProfile;
use App\Models\ProductVariant;
use App\Models\SalesDocument;
use App\Models\SalesDocumentLine;
use App\Models\TaxProfile;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\SunatTaxAffectationSeeder::class);
});

function variantWithIgv18(): ProductVariant
{
    $product = Product::factory()->create(['track_stock' => false, 'type' => Product::TYPE_SERVICE]);
    $variant = ProductVariant::factory()->for($product)->create();
    $template = TaxProfile::factory()->create(['igv_rate' => 18]);

    ProductTaxProfile::query()->create([
        'product_variant_id' => $variant->id,
        'tax_profile_id' => $template->id,
        'sunat_affectation_code' => '10',
        'igv_rate' => 18,
    ]);

    return $variant;
}

test('recalculate totals command fixes miscomputed igv from percentage rate', function () {
    $variant = variantWithIgv18();

    $document = SalesDocument::factory()->confirmed()->create([
        'subtotal' => 0.18,
        'tax_amount' => 3.32,
        'total' => 3.5,
    ]);

    SalesDocumentLine::factory()->create([
        'sales_document_id' => $document->id,
        'product_variant_id' => $variant->id,
        'quantity' => '1.000000',
        'unit_price' => '3.5000',
        'discount' => 0,
        'tax_affectation_code' => '10',
        'igv_rate' => '18.0000',
        'line_subtotal' => '0.1800',
        'igv_amount' => '3.3200',
        'line_total' => '3.5000',
        'line_order' => 0,
    ]);

    $this->artisan('sales:recalculate-totals', ['--id' => $document->id])
        ->assertSuccessful();

    $document->refresh();
    $line = $document->lines()->first();

    expect((string) $document->subtotal)->toBe('2.9661')
        ->and((string) $document->tax_amount)->toBe('0.5339')
        ->and((string) $document->total)->toBe('3.5000')
        ->and((string) $line->line_subtotal)->toBe('2.9661')
        ->and((string) $line->igv_amount)->toBe('0.5339')
        ->and((string) $line->igv_rate)->toBe('0.1800');
});

test('recalculate totals dry run does not persist changes', function () {
    $variant = variantWithIgv18();

    $document = SalesDocument::factory()->confirmed()->create([
        'subtotal' => 0.18,
        'tax_amount' => 3.32,
        'total' => 3.5,
    ]);

    SalesDocumentLine::factory()->create([
        'sales_document_id' => $document->id,
        'product_variant_id' => $variant->id,
        'quantity' => '1.000000',
        'unit_price' => '3.5000',
        'discount' => 0,
        'igv_rate' => '18.0000',
        'line_subtotal' => '0.1800',
        'igv_amount' => '3.3200',
        'line_total' => '3.5000',
        'line_order' => 0,
    ]);

    $this->artisan('sales:recalculate-totals', [
        '--id' => $document->id,
        '--dry-run' => true,
    ])->assertSuccessful();

    $document->refresh();

    expect((string) $document->subtotal)->toBe('0.1800')
        ->and((string) $document->tax_amount)->toBe('3.3200');
});

test('only affected flag skips documents with correct igv rate on lines', function () {
    $document = SalesDocument::factory()->confirmed()->create([
        'subtotal' => 10,
        'tax_amount' => 1.8,
        'total' => 11.8,
    ]);

    SalesDocumentLine::factory()->create([
        'sales_document_id' => $document->id,
        'igv_rate' => '0.1800',
        'line_subtotal' => '10.0000',
        'igv_amount' => '1.8000',
        'line_total' => '11.8000',
    ]);

    $this->artisan('sales:recalculate-totals', ['--only-affected' => true])
        ->assertSuccessful()
        ->expectsOutputToContain('0 con cambios');
});
