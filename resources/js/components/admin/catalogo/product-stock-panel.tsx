import { Link } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDecimalDisplay } from '@/lib/format-decimal';
import { cn } from '@/lib/utils';
import type {
    ProductVariantRow,
    WarehouseOption,
} from '@/types/admin/products';

type Props = {
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

export function ProductStockPanel({
    trackStock,
    variants,
    warehouseOptions,
    defaultWarehouseId,
    defaultWarehouseLabel,
    canManage,
}: Props) {
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

    const fallbackWarehouseId =
        defaultWarehouseId ??
        warehouseOptions.find((w) => w.is_default)?.value ??
        warehouseOptions[0]?.value ??
        '';

    return (
        <div className="space-y-3 border-t border-violet-100/90 pt-4">
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]">
                    Stock (solo consulta)
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[#7c6f8a]">
                    {defaultWarehouseLabel
                        ? `Referencia: ${defaultWarehouseLabel}. `
                        : ''}
                    Para <strong className="font-semibold text-[#5b21b6]">cargar o ajustar</strong>{' '}
                    cantidades usa{' '}
                    <strong className="font-semibold text-[#5b21b6]">
                        Inventario → Saldos por almacén
                    </strong>
                    . Todo queda registrado en el kardex.
                </p>
            </div>

            <ul className="space-y-2">
                {variants.map((variant) => {
                    const warehouseId =
                        variant.stock?.warehouse_id ?? fallbackWarehouseId;
                    const warehouseLabel =
                        warehouseOptions.find((w) => w.value === warehouseId)
                            ?.label ?? '—';

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
                                    {warehouseLabel}
                                </p>
                                <p className="mt-0.5 text-sm text-[#3b2d4a]">
                                    Stock:{' '}
                                    <span className="font-mono font-semibold">
                                        {formatDecimalDisplay(
                                            variant.stock?.quantity_on_hand ??
                                                '0',
                                        )}
                                    </span>
                                    {' · '}
                                    Costo prom.: S/{' '}
                                    <span className="font-mono font-semibold">
                                        {formatDecimalDisplay(
                                            variant.stock?.avg_cost ?? '0',
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
        </div>
    );
}
