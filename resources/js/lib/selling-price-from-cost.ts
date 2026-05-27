export type SalePriceMarkupType = 'percent' | 'fixed';

export function calcSellingPriceFromCost(
    unitCost: string,
    markupType: SalePriceMarkupType,
    markupValue: string,
): string | null {
    const cost = Number(unitCost.replace(',', '.'));

    if (Number.isNaN(cost) || cost <= 0) {
        return null;
    }

    const markup = Number(markupValue.replace(',', '.'));

    if (Number.isNaN(markup) || markup < 0) {
        return null;
    }

    const raw =
        markupType === 'percent'
            ? cost * (1 + markup / 100)
            : cost + markup;

    return raw.toFixed(2);
}
