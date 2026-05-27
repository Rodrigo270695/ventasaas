<?php

use App\Services\Catalog\ProductPriceFromCostService;

test('selling price applies percent markup on cost', function () {
    $service = new ProductPriceFromCostService;

    expect($service->calculateSellingPrice('7.50', 'percent', '30'))->toBe('9.75');
});

test('selling price applies fixed markup on cost', function () {
    $service = new ProductPriceFromCostService;

    expect($service->calculateSellingPrice('7.50', 'fixed', '2'))->toBe('9.50');
});
