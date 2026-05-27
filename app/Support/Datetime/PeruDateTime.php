<?php

namespace App\Support\Datetime;

use Illuminate\Support\Carbon;

final class PeruDateTime
{
    public static function timezone(): string
    {
        return config('app.timezone', 'America/Lima');
    }

    public static function now(): Carbon
    {
        return Carbon::now(self::timezone());
    }

    public static function parse(mixed $value): Carbon
    {
        return Carbon::parse($value, self::timezone())->timezone(self::timezone());
    }

    public static function label(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return self::parse($value)->format('d/m/Y H:i');
    }

    public static function toDateString(mixed $value): string
    {
        return self::parse($value)->toDateString();
    }

    public static function toInputValue(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        return self::parse($value)->format('Y-m-d\TH:i');
    }
}
