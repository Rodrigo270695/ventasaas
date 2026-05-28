import type { CartLine } from '@/types/welcome';

function formatMoney(amount: number, currencyCode: string): string {
    const symbol = currencyCode === 'PEN' ? 'S/' : currencyCode;

    return `${symbol} ${amount.toFixed(2)}`;
}

function lineTotal(line: CartLine): number {
    return Number(line.unitPrice) * line.quantity;
}

export function buildWhatsappOrderMessage(
    lines: CartLine[],
    storeName?: string | null,
): string {
    const header = storeName
        ? `Hola, quiero hacer un pedido en *${storeName}*:\n`
        : 'Hola, quiero hacer el siguiente pedido:\n';

    const items = lines
        .map((line) => {
            const label = line.variantLabel
                ? `${line.productName} · ${line.variantLabel}`
                : line.productName;
            const subtotal = lineTotal(line);

            return `• ${label} (${line.sku}) x${line.quantity} — ${formatMoney(subtotal, line.currencyCode)}`;
        })
        .join('\n');

    const total = lines.reduce((sum, line) => sum + lineTotal(line), 0);
    const currency = lines[0]?.currencyCode ?? 'PEN';

    return `${header}\n${items}\n\n*Total: ${formatMoney(total, currency)}*\n\nGracias.`;
}

export function buildWhatsappCheckoutUrl(
    whatsappNumber: string,
    message: string,
): string {
    const encoded = encodeURIComponent(message);

    return `https://wa.me/${whatsappNumber}?text=${encoded}`;
}

export function cartLineKey(productId: string, variantId: string): string {
    return `${productId}:${variantId}`;
}

export function formatCatalogPrice(price: string, currencyCode: string): string {
    const amount = Number(price);

    if (Number.isNaN(amount)) {
        return price;
    }

    return formatMoney(amount, currencyCode);
}
