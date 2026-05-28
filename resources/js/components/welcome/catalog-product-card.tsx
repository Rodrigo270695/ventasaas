import { ShoppingBag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

    const selectedVariant =
        product.variants.find((variant) => variant.id === variantId) ??
        product.variants[0];

    return (
        <article
            className={cn(
                'group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10',
                'bg-white/90 shadow-lg shadow-violet-950/5 backdrop-blur-sm',
                'transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-900/10',
            )}
        >
            <div className="relative bg-linear-to-br from-violet-100 via-fuchsia-50 to-white px-5 py-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.18),transparent_55%)]" />
                <div className="relative">
                    {product.category_name ? (
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7c3aed]">
                            {product.category_name}
                        </p>
                    ) : null}
                    <h3 className="mt-1 text-lg font-bold tracking-tight text-[#2e1065]">
                        {product.name}
                    </h3>
                    {product.brand_name ? (
                        <p className="mt-1 text-xs font-medium text-[#7c6f8a]">
                            {product.brand_name}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 px-5 py-4">
                {product.description ? (
                    <p className="line-clamp-2 text-sm leading-relaxed text-[#6b5b7a]">
                        {product.description}
                    </p>
                ) : (
                    <p className="text-sm text-[#9d8fb0]">
                        Producto disponible para pedido.
                    </p>
                )}

                {product.variants.length > 1 ? (
                    <div className="space-y-1.5">
                        <label
                            htmlFor={`variant-${product.id}`}
                            className="text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]"
                        >
                            Presentación
                        </label>
                        <Select value={variantId} onValueChange={setVariantId}>
                            <SelectTrigger
                                id={`variant-${product.id}`}
                                className="rounded-xl border-violet-200 bg-white"
                            >
                                <SelectValue placeholder="Elegir variante" />
                            </SelectTrigger>
                            <SelectContent>
                                {product.variants.map((variant) => (
                                    <SelectItem
                                        key={variant.id}
                                        value={variant.id}
                                    >
                                        {variant.label ?? variant.sku}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : selectedVariant?.label ? (
                    <p className="text-xs font-medium text-[#6b5b7a]">
                        {selectedVariant.label}
                    </p>
                ) : null}

                <div className="mt-auto flex items-end justify-between gap-3 border-t border-violet-100/80 pt-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9d8fb0]">
                            Precio
                        </p>
                        <p className="text-xl font-bold tabular-nums text-[#4c1d95]">
                            {selectedVariant
                                ? formatCatalogPrice(
                                      selectedVariant.price,
                                      selectedVariant.currency_code,
                                  )
                                : '—'}
                        </p>
                        {selectedVariant ? (
                            <p className="mt-0.5 font-mono text-[11px] text-[#9d8fb0]">
                                SKU {selectedVariant.sku}
                            </p>
                        ) : null}
                    </div>

                    <Button
                        type="button"
                        onClick={() => onAdd(variantId)}
                        disabled={!selectedVariant}
                        className="cursor-pointer rounded-xl bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-semibold text-white shadow-md shadow-violet-400/30 hover:opacity-95"
                    >
                        <ShoppingBag className="mr-1.5 size-4" />
                        Agregar
                    </Button>
                </div>
            </div>
        </article>
    );
}
