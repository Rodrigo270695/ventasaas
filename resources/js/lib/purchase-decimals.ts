import {
    formatDecimalDisplay,
    formatDecimalInput,
} from '@/lib/format-decimal';

const DIGITS = 2;

/** Valor para inputs de cantidad o precio en compras. */
export function formatPurchaseDecimal(
    value: string | number | null | undefined,
): string {
    return formatDecimalInput(value, DIGITS);
}

/** Texto en listas, hints y tablas de compras. */
export function formatPurchaseDecimalDisplay(
    value: string | number | null | undefined,
): string {
    return formatDecimalDisplay(value, DIGITS);
}

/** Al salir del campo: normaliza a 2 decimales. */
export function normalizePurchaseDecimalOnBlur(value: string): string {
    if (value.trim() === '') {
        return '';
    }

    return formatPurchaseDecimal(value);
}
