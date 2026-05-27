/**
 * Totales de línea de venta.
 * Convención: el precio unitario del catálogo ya incluye IGV cuando hay tasa > 0.
 * Debe coincidir con App\Services\Sales\SalesDocumentService (bc* con 4 decimales).
 */

/**
 * Perfiles tributarios guardan IGV en % (18); los cálculos usan decimal (0.18).
 */
export function normalizeIgvRate(rate: number): number {
    return rate > 1 ? rate / 100 : rate;
}

function roundSalesDecimal(value: number, decimals: number): number {
    const factor = 10 ** decimals;

    return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function calcSalesLineTotals(
    quantity: string,
    unitPrice: string,
    discount: string,
    igvRate: string,
): {
    line_subtotal: string;
    igv_amount: string;
    line_total: string;
} {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    const disc = parseFloat(discount) || 0;
    const rate = normalizeIgvRate(parseFloat(igvRate) || 0);
    const lineTotal = Math.max(0, roundSalesDecimal(qty * price - disc, 4));

    if (rate > 0) {
        const lineSubtotal = roundSalesDecimal(lineTotal / (1 + rate), 4);
        const igvAmount = roundSalesDecimal(lineTotal - lineSubtotal, 4);

        return {
            line_subtotal: lineSubtotal.toFixed(4),
            igv_amount: igvAmount.toFixed(4),
            line_total: lineTotal.toFixed(4),
        };
    }

    return {
        line_subtotal: lineTotal.toFixed(4),
        igv_amount: '0.0000',
        line_total: lineTotal.toFixed(4),
    };
}

export type SalesLineForTotals = {
    product_variant_id: string;
    quantity: string;
    unit_price: string;
    discount: string;
};

/**
 * Suma totales de cabecera (subtotal gravado, IGV, total con IGV).
 */
export function sumSalesDocumentTotals(
    lines: SalesLineForTotals[],
    resolveIgvRate: (variantId: string) => string,
    globalDiscount = '0',
): { subtotal: string; tax_amount: string; total: string } {
    let subtotal = 0;
    let tax = 0;
    let total = 0;

    for (const line of lines) {
        if (!line.product_variant_id.trim()) {
            continue;
        }

        const preview = calcSalesLineTotals(
            line.quantity,
            line.unit_price,
            line.discount,
            resolveIgvRate(line.product_variant_id),
        );

        subtotal += parseFloat(preview.line_subtotal);
        tax += parseFloat(preview.igv_amount);
        total += parseFloat(preview.line_total);
    }

    const discount = parseFloat(globalDiscount) || 0;
    total = Math.max(0, roundSalesDecimal(total - discount, 4));

    return {
        subtotal: roundSalesDecimal(subtotal, 2).toFixed(2),
        tax_amount: roundSalesDecimal(tax, 2).toFixed(2),
        total: roundSalesDecimal(total, 2).toFixed(2),
    };
}
