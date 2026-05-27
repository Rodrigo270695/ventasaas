import type { SalesVariantOption } from '@/types/admin/sales-documents';

export type SalesVariantLookups = {
    byBarcode: Map<string, string>;
    bySku: Map<string, string>;
};

export function buildSalesVariantLookups(
    options: readonly SalesVariantOption[],
): SalesVariantLookups {
    const byBarcode = new Map<string, string>();
    const bySku = new Map<string, string>();

    for (const option of options) {
        if (option.barcode) {
            const code = option.barcode.trim();

            if (code !== '') {
                byBarcode.set(code, option.value);
                byBarcode.set(code.toUpperCase(), option.value);
            }
        }

        if (option.sublabel) {
            const sku = option.sublabel.trim().toUpperCase();

            if (sku !== '') {
                bySku.set(sku, option.value);
            }
        }
    }

    return { byBarcode, bySku };
}

export function resolveVariantIdFromScan(
    rawCode: string,
    lookups: SalesVariantLookups,
): string | null {
    const trimmed = rawCode.trim();

    if (trimmed === '') {
        return null;
    }

    return (
        lookups.byBarcode.get(trimmed) ??
        lookups.byBarcode.get(trimmed.toUpperCase()) ??
        lookups.bySku.get(trimmed.toUpperCase()) ??
        null
    );
}
