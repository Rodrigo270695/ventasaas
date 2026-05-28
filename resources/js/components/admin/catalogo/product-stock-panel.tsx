import { Link } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    chokoSelectContentClass,
    chokoSelectItemClass,
    chokoSelectTriggerClass,
} from '@/components/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatDecimalDisplay } from '@/lib/format-decimal';
import { cn } from '@/lib/utils';
import type {
    ProductStockSummaryResponse,
    ProductVariantRow,
    WarehouseOption,
} from '@/types/admin/products';

type Props = {
    productId: string;
    trackStock: boolean;
    variants: ProductVariantRow[];
    warehouseOptions: WarehouseOption[];
    defaultWarehouseId: string | null;
    defaultWarehouseLabel: string | null;
    canManage: boolean;
};

function saldosAdjustUrl(
    warehouseId: string,
    variantId: string,
): string {
    const params = new URLSearchParams({
        warehouse_id: warehouseId,
        adjust_variant: variantId,
    });

    return `/admin/inventario/saldos?${params.toString()}`;
}

function stockSummaryUrl(productId: string, warehouseId: string): string {
    const params = new URLSearchParams({ warehouse_id: warehouseId });

    return `/admin/catalogo/productos/${productId}/stock-resumen?${params.toString()}`;
}

export function ProductStockPanel({
    productId,
    trackStock,
    variants,
    warehouseOptions,
    defaultWarehouseId,
    defaultWarehouseLabel,
    canManage,
}: Props) {
    const initialWarehouseId = useMemo(
        () =>
            defaultWarehouseId ??
            warehouseOptions.find((w) => w.is_default)?.value ??
            warehouseOptions[0]?.value ??
            '',
        [defaultWarehouseId, warehouseOptions],
    );

    const [warehouseId, setWarehouseId] = useState(initialWarehouseId);
    const [loading, setLoading] = useState(false);
    const [stockByVariantId, setStockByVariantId] = useState<
        Record<
            string,
            { quantity_on_hand: string; avg_cost: string } | undefined
        >
    >({});

    const selectedWarehouseLabel =
        warehouseOptions.find((w) => w.value === warehouseId)?.label ??
        defaultWarehouseLabel;

    const loadStock = useCallback(
        async (selectedWarehouseId: string) => {
            if (!selectedWarehouseId) {
                setStockByVariantId({});

                return;
            }

            setLoading(true);

            try {
                const response = await fetch(
                    stockSummaryUrl(productId, selectedWarehouseId),
                    {
                        credentials: 'same-origin',
                        headers: { Accept: 'application/json' },
                    },
                );

                if (!response.ok) {
                    return;
                }

                const body =
                    (await response.json()) as ProductStockSummaryResponse;
                const nextStock: Record<
                    string,
                    { quantity_on_hand: string; avg_cost: string }
                > = {};

                for (const variant of body.variants) {
                    nextStock[variant.variant_id] = {
                        quantity_on_hand: variant.quantity_on_hand,
                        avg_cost: variant.avg_cost,
                    };
                }

                setStockByVariantId(nextStock);
            } finally {
                setLoading(false);
            }
        },
        [productId],
    );

    useEffect(() => {
        setWarehouseId(initialWarehouseId);
    }, [initialWarehouseId]);

    useEffect(() => {
        if (trackStock && warehouseId) {
            void loadStock(warehouseId);
        }
    }, [trackStock, warehouseId, loadStock]);

    if (!trackStock) {
        return (
            <div className="space-y-2 border-t border-violet-100/90 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]">
                    Inventario
                </p>
                <p className="text-xs text-[#6b5b7a]">
                    Este producto no controla stock (servicio o bien sin
                    control).
                </p>
            </div>
        );
    }

    if (warehouseOptions.length === 0) {
        return (
            <div className="space-y-2 border-t border-violet-100/90 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]">
                    Inventario
                </p>
                <p className="text-xs text-amber-700">
                    Crea un almacén en Inventario → Almacenes antes de registrar
                    stock.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 border-t border-violet-100/90 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]">
                        Stock (solo consulta)
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#7c6f8a]">
                        Para{' '}
                        <strong className="font-semibold text-[#5b21b6]">
                            cargar o ajustar
                        </strong>{' '}
                        cantidades usa{' '}
                        <strong className="font-semibold text-[#5b21b6]">
                            Inventario → Stock Por almacen
                        </strong>
                        . Todo queda registrado en el kardex.
                    </p>
                </div>
                {warehouseOptions.length > 1 ? (
                    <div className="w-full sm:max-w-xs">
                        <label
                            htmlFor="product-stock-warehouse"
                            className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]"
                        >
                            Almacén / tienda
                        </label>
                        <Select
                            value={warehouseId}
                            onValueChange={setWarehouseId}
                        >
                            <SelectTrigger
                                id="product-stock-warehouse"
                                aria-label="Almacén"
                                className={chokoSelectTriggerClass}
                            >
                                <SelectValue placeholder="Almacén…" />
                            </SelectTrigger>
                            <SelectContent
                                className={chokoSelectContentClass}
                                position="popper"
                                sideOffset={4}
                            >
                                {warehouseOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        className={chokoSelectItemClass}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : selectedWarehouseLabel ? (
                    <p className="text-xs text-[#6b5b7a]">
                        {selectedWarehouseLabel}
                    </p>
                ) : null}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Spinner className="size-5 text-[#7c3aed]" />
                </div>
            ) : (
                <ul className="space-y-2">
                    {variants.map((variant) => {
                        const stock = stockByVariantId[variant.id];

                        return (
                            <li
                                key={variant.id}
                                className={cn(
                                    'flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between',
                                    variant.is_default
                                        ? 'border-[#7c3aed]/35 bg-violet-50/40'
                                        : 'border-violet-100/90 bg-white/80',
                                )}
                            >
                                <div className="min-w-0">
                                    <p className="font-mono text-sm font-semibold text-[#4c1d95]">
                                        {variant.sku}
                                        {variant.label ? (
                                            <span className="ml-2 font-sans text-xs font-normal text-[#6b5b7a]">
                                                {variant.label}
                                            </span>
                                        ) : null}
                                    </p>
                                    <p className="mt-1 text-xs text-[#6b5b7a]">
                                        {selectedWarehouseLabel ?? '—'}
                                    </p>
                                    <p className="mt-0.5 text-sm text-[#3b2d4a]">
                                        Stock:{' '}
                                        <span className="font-mono font-semibold">
                                            {formatDecimalDisplay(
                                                stock?.quantity_on_hand ?? '0',
                                            )}
                                        </span>
                                        {' · '}
                                        Costo prom.: S/{' '}
                                        <span className="font-mono font-semibold">
                                            {formatDecimalDisplay(
                                                stock?.avg_cost ?? '0',
                                            )}
                                        </span>
                                    </p>
                                </div>
                                {canManage && warehouseId ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0 cursor-pointer rounded-lg border-violet-200 text-[#6d28d9] hover:bg-violet-50"
                                        asChild
                                    >
                                        <Link
                                            href={saldosAdjustUrl(
                                                warehouseId,
                                                variant.id,
                                            )}
                                        >
                                            <ExternalLink className="mr-1.5 size-3.5" />
                                            Ajustar stock
                                        </Link>
                                    </Button>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
