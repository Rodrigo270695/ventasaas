import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    buildWhatsappCheckoutUrl,
    buildWhatsappOrderMessage,
    cartLineKey,
} from '@/lib/whatsapp-order';
import type { CartLine, CatalogProduct } from '@/types/welcome';

const STORAGE_KEY = 'choko-catalog-cart';

function readStoredCart(): CartLine[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw) as CartLine[];

        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeStoredCart(lines: CartLine[]): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
}

export function useCatalogCart(
    whatsappNumber: string | null,
    storeName?: string | null,
) {
    const [lines, setLines] = useState<CartLine[]>(() => readStoredCart());
    const [cartOpen, setCartOpen] = useState(false);

    useEffect(() => {
        writeStoredCart(lines);
    }, [lines]);

    const itemCount = useMemo(
        () => lines.reduce((sum, line) => sum + line.quantity, 0),
        [lines],
    );

    const total = useMemo(
        () =>
            lines.reduce(
                (sum, line) => sum + Number(line.unitPrice) * line.quantity,
                0,
            ),
        [lines],
    );

    const addProduct = useCallback(
        (product: CatalogProduct, variantId: string, quantity = 1) => {
            const variant = product.variants.find((v) => v.id === variantId);

            if (!variant) {
                return;
            }

            const key = cartLineKey(product.id, variant.id);

            setLines((current) => {
                const existing = current.find((line) => line.key === key);

                if (existing) {
                    return current.map((line) =>
                        line.key === key
                            ? {
                                  ...line,
                                  quantity: line.quantity + quantity,
                              }
                            : line,
                    );
                }

                return [
                    ...current,
                    {
                        key,
                        productId: product.id,
                        productName: product.name,
                        variantId: variant.id,
                        sku: variant.sku,
                        variantLabel: variant.label,
                        unitPrice: variant.price,
                        currencyCode: variant.currency_code,
                        quantity,
                    },
                ];
            });
            setCartOpen(true);
        },
        [],
    );

    const updateQuantity = useCallback((key: string, quantity: number) => {
        if (quantity <= 0) {
            setLines((current) => current.filter((line) => line.key !== key));

            return;
        }

        setLines((current) =>
            current.map((line) =>
                line.key === key ? { ...line, quantity } : line,
            ),
        );
    }, []);

    const removeLine = useCallback((key: string) => {
        setLines((current) => current.filter((line) => line.key !== key));
    }, []);

    const clearCart = useCallback(() => {
        setLines([]);
    }, []);

    const checkoutUrl = useMemo(() => {
        if (!whatsappNumber || lines.length === 0) {
            return null;
        }

        const message = buildWhatsappOrderMessage(lines, storeName);

        return buildWhatsappCheckoutUrl(whatsappNumber, message);
    }, [whatsappNumber, lines, storeName]);

    return {
        lines,
        itemCount,
        total,
        cartOpen,
        setCartOpen,
        addProduct,
        updateQuantity,
        removeLine,
        clearCart,
        checkoutUrl,
        canCheckout: Boolean(whatsappNumber && lines.length > 0),
    };
}
