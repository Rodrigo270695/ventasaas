import { router } from '@inertiajs/react';
import { Check, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    destroy as destroyPrice,
    store as storePrice,
    update as updatePrice,
} from '@/routes/admin/catalogo/productos/precios';
import { FormTextField } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type {
    PriceListOption,
    ProductVariantPriceRow,
    ProductVariantRow,
} from '@/types/admin/products';

type Props = {
    productId: string;
    variants: ProductVariantRow[];
    priceListOptions: PriceListOption[];
    canManage: boolean;
    errors?: Record<string, string>;
};

function normalizeAmount(value: string): string {
    return value.trim().replace(',', '.');
}

function formatAmountForInput(value: string | undefined): string {
    if (!value) {
        return '';
    }

    const numeric = Number(value);

    if (Number.isNaN(numeric)) {
        return value;
    }

    return String(numeric);
}

type VariantPriceEditorProps = {
    productId: string;
    variant: ProductVariantRow;
    priceList: PriceListOption;
    existing: ProductVariantPriceRow | undefined;
    canManage: boolean;
    error?: string;
};

function VariantPriceEditor({
    productId,
    variant,
    priceList,
    existing,
    canManage,
    error,
}: VariantPriceEditorProps) {
    const [amount, setAmount] = useState(
        formatAmountForInput(existing?.amount),
    );
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        setAmount(formatAmountForInput(existing?.amount));
    }, [existing?.amount, existing?.id]);

    const save = () => {
        const normalized = normalizeAmount(amount);

        if (!normalized || Number(normalized) < 0) {
            return;
        }

        setProcessing(true);

        const options = {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        };

        if (existing) {
            router.put(
                updatePrice.url({
                    producto: productId,
                    precio: existing.id,
                }),
                { amount: normalized },
                options,
            );

            return;
        }

        router.post(
            storePrice.url({ producto: productId }),
            {
                product_variant_id: variant.id,
                price_list_id: priceList.value,
                amount: normalized,
            },
            options,
        );
    };

    const remove = () => {
        if (!existing) {
            return;
        }

        setProcessing(true);
        router.delete(
            destroyPrice.url({ producto: productId, precio: existing.id }),
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    if (!canManage) {
        return (
            <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[#6b5b7a]">{priceList.label}</span>
                <span className="font-mono font-semibold text-[#4c1d95]">
                    {existing
                        ? `${priceList.currency_code} ${formatAmountForInput(existing.amount)}`
                        : '—'}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-row items-end gap-2 max-sm:gap-1.5">
            <FormTextField
                id={`price-${variant.id}-${priceList.value}`}
                name={`price_${variant.id}_${priceList.value}`}
                label={priceList.code}
                value={amount}
                onChange={setAmount}
                placeholder="0.00"
                inputMode="decimal"
                disabled={processing}
                error={error}
                fieldClassName="min-w-0 flex-1"
                className="font-mono max-sm:h-9 max-sm:text-sm"
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        save();
                    }
                }}
            />
            <div className="flex shrink-0 gap-1 max-sm:pb-0">
                <Button
                    type="button"
                    size="sm"
                    disabled={processing || !normalizeAmount(amount)}
                    className="size-9 shrink-0 cursor-pointer rounded-lg bg-[#7c3aed] p-0 text-white hover:bg-[#6d28d9] sm:size-8"
                    onClick={save}
                    aria-label={`Guardar precio ${priceList.code}`}
                >
                    {processing ? (
                        <Spinner />
                    ) : (
                        <Check className="size-3.5" />
                    )}
                </Button>
                {existing && (
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={processing}
                        className="size-9 shrink-0 cursor-pointer p-0 text-red-600 hover:bg-red-50 sm:size-8"
                        onClick={remove}
                        aria-label="Quitar precio"
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                )}
            </div>
        </div>
    );
}

export function ProductPricesPanel({
    productId,
    variants,
    priceListOptions,
    canManage,
    errors = {},
}: Props) {
    if (priceListOptions.length === 0) {
        return (
            <div className="border-t border-violet-100/90 pt-4">
                <p className="text-[11px] text-[#7c6f8a]">
                    Crea al menos una lista en{' '}
                    <span className="font-semibold text-[#6d28d9]">
                        Catálogo → Listas de precios
                    </span>
                    .
                </p>
            </div>
        );
    }

    const globalError =
        errors.amount ??
        errors.price_list_id ??
        errors.product_variant_id;

    return (
        <div className="space-y-3 border-t border-violet-100/90 pt-4">
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]">
                    Precios de venta
                </p>
                <p className="mt-0.5 text-[11px] text-[#7c6f8a]">
                    Pulsa el botón ✓ en cada lista para guardar ese precio.
                    «Guardar datos» solo actualiza nombre, categoría, etc.
                </p>
            </div>

            {globalError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-100">
                    {globalError}
                </p>
            )}

            <ul className="space-y-3">
                {variants.map((variant) => (
                    <li
                        key={variant.id}
                        className={cn(
                            'rounded-lg border px-3 py-3',
                            variant.is_default
                                ? 'border-[#7c3aed]/35 bg-violet-50/40'
                                : 'border-violet-100/90 bg-white/80',
                        )}
                    >
                        <p className="mb-2 font-mono text-sm font-semibold text-[#4c1d95]">
                            {variant.sku}
                            {variant.label ? (
                                <span className="ml-2 font-sans text-xs font-normal text-[#6b5b7a]">
                                    {variant.label}
                                </span>
                            ) : null}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {priceListOptions.map((list) => (
                                <VariantPriceEditor
                                    key={`${variant.id}-${list.value}`}
                                    productId={productId}
                                    variant={variant}
                                    priceList={list}
                                    existing={variant.prices.find(
                                        (price) =>
                                            price.price_list_id ===
                                            list.value,
                                    )}
                                    canManage={canManage}
                                    error={errors.amount}
                                />
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
