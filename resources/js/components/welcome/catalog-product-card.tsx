import { Check, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CatalogProductVisual } from '@/components/welcome/catalog-product-visual';
import { formatCatalogPrice } from '@/lib/whatsapp-order';
import { cn } from '@/lib/utils';
import type { CatalogProduct } from '@/types/welcome';

type Props = {
    product: CatalogProduct;
    onAdd: (variantId: string) => void;
};

export function CatalogProductCard({ product, onAdd }: Props) {
    const defaultVariantId = useMemo(
        () =>
            product.variants.find((variant) => variant.is_default)?.id ??
            product.variants[0]?.id ??
            '',
        [product.variants],
    );

    const [variantId, setVariantId] = useState(defaultVariantId);
    const [justAdded, setJustAdded] = useState(false);

    const selectedVariant =
        product.variants.find((variant) => variant.id === variantId) ??
        product.variants[0];

    useEffect(() => {
        setVariantId(defaultVariantId);
    }, [defaultVariantId, product.id]);

    useEffect(() => {
        if (!justAdded) {
            return;
        }

        const timer = window.setTimeout(() => setJustAdded(false), 1400);

        return () => window.clearTimeout(timer);
    }, [justAdded]);

    const handleAdd = () => {
        if (!selectedVariant) {
            return;
        }

        onAdd(selectedVariant.id);
        setJustAdded(true);
    };

    const hasMultipleVariants = product.variants.length > 1;

    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white transition hover:shadow-md">
            <div className="relative overflow-hidden rounded-2xl">
                <CatalogProductVisual product={product} />

                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!selectedVariant}
                    aria-label={`Agregar ${product.name} al carrito`}
                    className={cn(
                        'absolute right-2 bottom-2 flex size-9 cursor-pointer items-center justify-center rounded-full shadow-md transition-all duration-300',
                        justAdded
                            ? 'bg-[#22c55e] text-white'
                            : 'bg-white text-[#374151] hover:bg-[#f97316] hover:text-white',
                    )}
                >
                    {justAdded ? (
                        <Check className="size-4" strokeWidth={3} />
                    ) : (
                        <Plus className="size-4" strokeWidth={2.5} />
                    )}
                </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 px-1 py-3">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#1f2937]">
                    {product.name}
                </h3>

                {selectedVariant ? (
                    <p className="text-base font-black tabular-nums text-[#1f2937]">
                        {formatCatalogPrice(
                            selectedVariant.price,
                            selectedVariant.currency_code,
                        )}
                    </p>
                ) : null}

                {hasMultipleVariants ? (
                    <div className="mt-auto flex flex-wrap gap-1">
                        {product.variants.map((variant) => {
                            const active = variant.id === variantId;
                            const label = variant.label ?? variant.sku;

                            return (
                                <button
                                    key={variant.id}
                                    type="button"
                                    onClick={() => setVariantId(variant.id)}
                                    className={cn(
                                        'cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-semibold transition',
                                        active
                                            ? 'bg-[#fff7ed] text-[#ea580c] ring-1 ring-[#fed7aa]'
                                            : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]',
                                    )}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                ) : null}
            </div>
        </article>
    );
}
