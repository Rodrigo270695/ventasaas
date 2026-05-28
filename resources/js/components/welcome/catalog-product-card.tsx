import { Check, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CatalogProductVisual } from '@/components/welcome/catalog-product-visual';
import { Button } from '@/components/ui/button';
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

    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border-[3px] border-[#fbcfe8] bg-white shadow-[0_20px_50px_-28px_rgba(236,72,153,0.45)] transition duration-300 hover:-translate-y-1 hover:border-[#f9a8d4] hover:shadow-[0_28px_60px_-24px_rgba(236,72,153,0.4)]">
            <div className="relative">
                <CatalogProductVisual product={product} />

                {product.category_name ? (
                    <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black tracking-[0.14em] text-[#be185d] uppercase shadow-sm ring-1 ring-[#fbcfe8]">
                        {product.category_name}
                    </span>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="space-y-1.5">
                    <h3 className="text-xl font-black tracking-tight text-[#831843]">
                        {product.name}
                    </h3>
                    {product.brand_name ? (
                        <p className="text-xs font-bold tracking-wide text-[#db2777] uppercase">
                            {product.brand_name}
                        </p>
                    ) : null}
                    {product.description ? (
                        <p className="line-clamp-2 text-sm leading-relaxed text-[#9d174d]/80">
                            {product.description}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2.5">
                    <p className="text-[10px] font-black tracking-[0.16em] text-[#be185d]/70 uppercase">
                        {product.variants.length > 1
                            ? 'Elige presentación'
                            : 'Presentación'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {product.variants.map((variant) => {
                            const active = variant.id === variantId;
                            const label = variant.label ?? variant.sku;

                            return (
                                <button
                                    key={variant.id}
                                    type="button"
                                    onClick={() => setVariantId(variant.id)}
                                    className={cn(
                                        'cursor-pointer rounded-2xl border px-3 py-2 text-left transition',
                                        active
                                            ? 'border-[#ec4899] bg-linear-to-r from-[#fce7f3] to-[#fdf2f8] shadow-sm ring-2 ring-[#f9a8d4]/60'
                                            : 'border-[#fbcfe8] bg-white text-[#9d174d] hover:border-[#f9a8d4] hover:bg-[#fff5f8]',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'block text-xs font-bold',
                                            active
                                                ? 'text-[#831843]'
                                                : 'text-[#be185d]',
                                        )}
                                    >
                                        {label}
                                    </span>
                                    <span
                                        className={cn(
                                            'mt-0.5 block text-sm font-black tabular-nums',
                                            active
                                                ? 'text-[#db2777]'
                                                : 'text-[#ec4899]',
                                        )}
                                    >
                                        {formatCatalogPrice(
                                            variant.price,
                                            variant.currency_code,
                                        )}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#fce7f3] pt-4">
                    <div>
                        <p className="text-[10px] font-bold tracking-wide text-[#be185d]/60 uppercase">
                            SKU
                        </p>
                        <p className="font-mono text-xs font-semibold text-[#9d174d]">
                            {selectedVariant?.sku ?? '—'}
                        </p>
                        {selectedVariant ? (
                            <p className="mt-1 text-2xl font-black tabular-nums text-[#db2777]">
                                {formatCatalogPrice(
                                    selectedVariant.price,
                                    selectedVariant.currency_code,
                                )}
                            </p>
                        ) : null}
                    </div>

                    <Button
                        type="button"
                        onClick={handleAdd}
                        disabled={!selectedVariant}
                        className={cn(
                            'h-11 cursor-pointer rounded-full px-5 font-black shadow-lg transition-all duration-300',
                            justAdded
                                ? 'bg-[#22c55e] text-white shadow-emerald-300/40 hover:bg-[#22c55e]'
                                : 'bg-linear-to-r from-[#ff4da6] to-[#c026d3] text-white shadow-pink-300/50 hover:opacity-95',
                        )}
                    >
                        {justAdded ? (
                            <>
                                <Check className="mr-1.5 size-4" />
                                Listo
                            </>
                        ) : (
                            <>
                                <ShoppingBag className="mr-1.5 size-4" />
                                Agregar
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </article>
    );
}
