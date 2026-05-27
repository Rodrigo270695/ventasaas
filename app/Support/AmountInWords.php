<?php

namespace App\Support;

final class AmountInWords
{
    private const UNITS = [
        '', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
        'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE',
        'DIECIOCHO', 'DIECINUEVE',
    ];

    private const TENS = [
        '', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA',
        'OCHENTA', 'NOVENTA',
    ];

    private const HUNDREDS = [
        '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
        'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
    ];

    public static function soles(float|string $amount): string
    {
        $normalized = number_format((float) $amount, 2, '.', '');
        [$integerPart, $decimals] = explode('.', $normalized);

        $integer = (int) $integerPart;
        $words = $integer === 0 ? 'CERO' : self::toWords($integer);

        if ($integer === 1) {
            $words = 'UN';
        }

        return sprintf('SON %s CON %s/100 SOLES', $words, $decimals);
    }

    private static function toWords(int $number): string
    {
        if ($number < 20) {
            return self::UNITS[$number];
        }

        if ($number < 100) {
            $ten = intdiv($number, 10);
            $unit = $number % 10;

            if ($number === 20) {
                return 'VEINTE';
            }

            if ($number < 30) {
                return $unit === 0 ? 'VEINTE' : 'VEINTI'.self::UNITS[$unit];
            }

            $segment = self::TENS[$ten];

            return $unit === 0 ? $segment : $segment.' Y '.self::UNITS[$unit];
        }

        if ($number < 1000) {
            if ($number === 100) {
                return 'CIEN';
            }

            $hundred = intdiv($number, 100);
            $remainder = $number % 100;

            return trim(self::HUNDREDS[$hundred].($remainder > 0 ? ' '.self::toWords($remainder) : ''));
        }

        if ($number < 1_000_000) {
            $thousands = intdiv($number, 1000);
            $remainder = $number % 1000;
            $prefix = $thousands === 1 ? 'MIL' : self::toWords($thousands).' MIL';

            return trim($prefix.($remainder > 0 ? ' '.self::toWords($remainder) : ''));
        }

        $millions = intdiv($number, 1_000_000);
        $remainder = $number % 1_000_000;
        $prefix = $millions === 1 ? 'UN MILLON' : self::toWords($millions).' MILLONES';

        return trim($prefix.($remainder > 0 ? ' '.self::toWords($remainder) : ''));
    }
}
