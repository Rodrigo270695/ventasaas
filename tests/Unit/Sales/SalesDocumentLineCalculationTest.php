<?php

use App\Models\Product;
use App\Models\ProductTaxProfile;
use App\Models\ProductVariant;
use App\Services\Sales\SalesDocumentService;

function makeVariantForTaxTest(?ProductTaxProfile $taxProfile = null): ProductVariant
{
    $variant = new ProductVariant;
    $product = new Product(['name' => 'Producto prueba']);
    $variant->setRelation('product', $product);
    $variant->setRelation('taxProfile', $taxProfile);

    return $variant;
}

test('line total treats unit price as tax inclusive when igv applies', function () {
    $service = app(SalesDocumentService::class);

    $result = $service->calculateLine([
        'quantity' => '1',
        'unit_price' => '118',
        'discount' => '0',
    ], makeVariantForTaxTest());

    expect($result['line_total'])->toBe('118.0000')
        ->and($result['line_subtotal'])->toBe('100.0000')
        ->and($result['igv_amount'])->toBe('18.0000');
});

test('line total equals subtotal when affectation has no igv', function () {
    $profile = new ProductTaxProfile([
        'sunat_affectation_code' => '20',
        'igv_rate' => '0',
    ]);

    $service = app(SalesDocumentService::class);

    $result = $service->calculateLine([
        'quantity' => '2',
        'unit_price' => '50',
        'discount' => '0',
    ], makeVariantForTaxTest($profile));

    expect($result['line_total'])->toBe('100.0000')
        ->and($result['line_subtotal'])->toBe('100.0000')
        ->and($result['igv_amount'])->toBe('0.0000');
});

test('line total normalizes igv rate stored as percentage on tax profile', function () {
    $profile = new ProductTaxProfile([
        'sunat_affectation_code' => '10',
        'igv_rate' => '18',
    ]);

    $service = app(SalesDocumentService::class);

    $result = $service->calculateLine([
        'quantity' => '1',
        'unit_price' => '3.50',
        'discount' => '0',
    ], makeVariantForTaxTest($profile));

    expect($result['line_total'])->toBe('3.5000')
        ->and($result['line_subtotal'])->toBe('2.9661')
        ->and($result['igv_amount'])->toBe('0.5339')
        ->and($result['igv_rate'])->toBe('0.1800');
});

test('document totals match sum of two tax inclusive lines at 18 percent', function () {
    $profile = new ProductTaxProfile([
        'sunat_affectation_code' => '10',
        'igv_rate' => '18',
    ]);

    $service = app(SalesDocumentService::class);
    $variant = makeVariantForTaxTest($profile);

    $lineOne = $service->calculateLine([
        'quantity' => '1',
        'unit_price' => '1.50',
        'discount' => '0',
    ], $variant);

    $lineTwo = $service->calculateLine([
        'quantity' => '2',
        'unit_price' => '3.50',
        'discount' => '0',
    ], $variant);

    $subtotal = bcadd($lineOne['line_subtotal'], $lineTwo['line_subtotal'], 4);
    $tax = bcadd($lineOne['igv_amount'], $lineTwo['igv_amount'], 4);
    $total = bcadd($lineOne['line_total'], $lineTwo['line_total'], 4);

    expect($total)->toBe('8.5000')
        ->and(number_format((float) $subtotal, 2, '.', ''))->toBe('7.20')
        ->and(number_format((float) $tax, 2, '.', ''))->toBe('1.30');
});

test('example from catalog price 13 with 18 percent igv', function () {
    $service = app(SalesDocumentService::class);

    $result = $service->calculateLine([
        'quantity' => '1',
        'unit_price' => '13',
        'discount' => '0',
    ], makeVariantForTaxTest());

    expect($result['line_total'])->toBe('13.0000')
        ->and($result['line_subtotal'])->toBe('11.0169')
        ->and($result['igv_amount'])->toBe('1.9831');
});
