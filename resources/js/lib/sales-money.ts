/**
 * Formato monetario compartido entre formulario de venta y ticket.
 */
export function salesCurrencyPrefix(currencyCode: string): string {
    return currencyCode === 'PEN' ? 'S/' : `${currencyCode} `;
}

export function formatSalesMoney(
    value: string | number,
    currencyCode = 'PEN',
): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (Number.isNaN(num)) {
        return `${salesCurrencyPrefix(currencyCode)}0.00`;
    }

    const formatted = num.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return `${salesCurrencyPrefix(currencyCode)}${formatted}`;
}
