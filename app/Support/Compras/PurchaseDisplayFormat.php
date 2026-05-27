<?php

namespace App\Support\Compras;

final class PurchaseDisplayFormat
{
    public static function decimal(mixed $value): string
    {
        return number_format((float) $value, 2, '.', '');
    }
}
