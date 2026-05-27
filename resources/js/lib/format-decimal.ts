const DEFAULT_FRACTION_DIGITS = 2;

/**
 * Formatea un valor numérico para mostrar en inputs (siempre N decimales).
 */
export function formatDecimalInput(
    value: string | number | null | undefined,
    fractionDigits: number = DEFAULT_FRACTION_DIGITS,
): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const normalized = String(value).trim().replace(',', '.');
    const numeric = Number(normalized);

    if (Number.isNaN(numeric)) {
        return String(value);
    }

    return numeric.toFixed(fractionDigits);
}

/**
 * Formatea cantidades/montos para tablas y textos (locale es-PE).
 */
export function formatDecimalDisplay(
    value: string | number | null | undefined,
    fractionDigits: number = DEFAULT_FRACTION_DIGITS,
): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const normalized = String(value).trim().replace(',', '.');
    const numeric = Number(normalized);

    if (Number.isNaN(numeric)) {
        return String(value);
    }

    return numeric.toLocaleString('es-PE', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
}
