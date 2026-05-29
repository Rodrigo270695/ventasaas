<?php

use App\Support\VariantExpiryStatus;
use Carbon\Carbon;

test('variant expiry status detects expired and expiring soon', function () {
    $today = Carbon::parse('2026-05-28');

    $expired = VariantExpiryStatus::evaluate(
        Carbon::parse('2026-05-20'),
        14,
        $today,
    );

    expect($expired['is_expired'])->toBeTrue()
        ->and($expired['level'])->toBe('critical');

    $soon = VariantExpiryStatus::evaluate(
        Carbon::parse('2026-06-05'),
        14,
        $today,
    );

    expect($soon['is_expiring_soon'])->toBeTrue()
        ->and($soon['level'])->toBe('warning')
        ->and($soon['days_until_expiry'])->toBe(8);

    $ok = VariantExpiryStatus::evaluate(
        Carbon::parse('2026-12-31'),
        14,
        $today,
    );

    expect($ok['level'])->toBeNull();
});
