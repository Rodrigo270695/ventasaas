import { Link } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { formatDecimalDisplay } from '@/lib/format-decimal';
import { expiryStatusLabel, formatExpiryDate } from '@/lib/expiry-display';
import {
    chokoSelectContentClass,
    chokoSelectItemClass,
    chokoSelectTriggerClass,
} from '@/components/form';
import { cn } from '@/lib/utils';
import type {
    ProductRow,
    ProductStockSummaryResponse,
    WarehouseOption,
} from '@/types/admin/products';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: ProductRow | null;
    warehouseOptions: WarehouseOption[];
    defaultWarehouseId: string | null;
};

function stockSummaryUrl(productId: string, warehouseId: string): string {
    const params = new URLSearchParams({ warehouse_id: warehouseId });

    return `/admin/catalogo/productos/${productId}/stock-resumen?${params.toString()}`;
}

function formatQty(value: string): string {
    return formatDecimalDisplay(value) || value;
}

function formatMoney(value: string): string {
    return formatDecimalDisplay(value) || value;
}

export function ProductStockModal({
    open,
    onOpenChange,
    product,
    warehouseOptions,
    defaultWarehouseId,
}: Props) {
    const [warehouseId, setWarehouseId] = useState(
        defaultWarehouseId ?? warehouseOptions[0]?.value ?? '',
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState<ProductStockSummaryResponse | null>(
        null,
    );

    const loadSummary = useCallback(
        async (productId: string, selectedWarehouseId: string) => {
            if (!selectedWarehouseId) {
                setSummary(null);
                setError('Selecciona un almacén.');

                return;
            }

            setLoading(true);
            setError('');

            try {
                const response = await fetch(
                    stockSummaryUrl(productId, selectedWarehouseId),
                    {
                        credentials: 'same-origin',
                        headers: { Accept: 'application/json' },
                    },
                );

                const body = (await response.json()) as
                    | ProductStockSummaryResponse
                    | { message?: string };

                if (!response.ok) {
                    setError(
                        'message' in body && body.message
                            ? body.message
                            : 'No se pudo cargar el stock.',
                    );
                    setSummary(null);

                    return;
                }

                setSummary(body as ProductStockSummaryResponse);
            } catch {
                setError('No se pudo cargar el stock.');
                setSummary(null);
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        if (!open || !product) {
            return;
        }

        const initialWarehouseId =
            defaultWarehouseId ?? warehouseOptions[0]?.value ?? '';
        setWarehouseId(initialWarehouseId);

        if (initialWarehouseId) {
            void loadSummary(product.id, initialWarehouseId);
        }
    }, [open, product, defaultWarehouseId, warehouseOptions, loadSummary]);

    const handleWarehouseChange = (value: string) => {
        setWarehouseId(value);

        if (product) {
            void loadSummary(product.id, value);
        }
    };

    if (!product) {
        return null;
    }

    const showStockTable =
        product.track_stock &&
        product.type === 'good' &&
        warehouseOptions.length > 0;

    return (
        <AppModal open={open} onOpenChange={onOpenChange} size="lg">
            <AppModalHeader
                title="Stock por almacén"
                description={`Variantes, cantidades y costo promedio de ${product.name}.`}
            />
            <AppModalBody className="space-y-4">
                {!product.track_stock || product.type !== 'good' ? (
                    <p className="text-sm text-[#6b5b7a]">
                        Este producto no controla stock (servicio o bien sin
                        control).
                    </p>
                ) : warehouseOptions.length === 0 ? (
                    <p className="text-sm text-amber-700">
                        Crea un almacén en Inventario → Almacenes antes de
                        consultar stock.
                    </p>
                ) : (
                    <>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <label
                                htmlFor="product-stock-warehouse"
                                className="text-xs font-semibold uppercase tracking-wide text-[#7c3aed]"
                            >
                                Almacén
                            </label>
                            <Select
                                value={warehouseId}
                                onValueChange={handleWarehouseChange}
                            >
                                <SelectTrigger
                                    id="product-stock-warehouse"
                                    aria-label="Almacén"
                                    className={cn(
                                        chokoSelectTriggerClass,
                                        'w-full sm:max-w-xs',
                                    )}
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

                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Spinner className="size-6 text-[#7c3aed]" />
                            </div>
                        ) : error ? (
                            <p className="text-sm text-rose-700">{error}</p>
                        ) : showStockTable && summary ? (
                            <div className="overflow-x-auto rounded-xl border border-violet-100/90">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-violet-100/90 bg-violet-50/50 text-left text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]">
                                            <th className="px-3 py-2.5">
                                                SKU
                                            </th>
                                            <th className="px-3 py-2.5">
                                                Variante
                                            </th>
                                            <th className="px-3 py-2.5 text-right">
                                                Stock
                                            </th>
                                            <th className="hidden px-3 py-2.5 text-right sm:table-cell">
                                                Mínimo
                                            </th>
                                            <th className="px-3 py-2.5 text-right">
                                                Costo prom.
                                            </th>
                                            <th className="hidden px-3 py-2.5 text-right md:table-cell">
                                                Valor
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.variants.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-3 py-6 text-center text-[#6b5b7a]"
                                                >
                                                    No hay variantes activas.
                                                </td>
                                            </tr>
                                        ) : (
                                            summary.variants.map((variant) => (
                                                <tr
                                                    key={variant.variant_id}
                                                    className={cn(
                                                        'border-b border-violet-50 last:border-b-0',
                                                        variant.is_out_of_stock
                                                            ? 'bg-rose-50/60'
                                                            : variant.is_expired
                                                              ? 'bg-rose-50/40'
                                                              : variant.is_low_stock ||
                                                                  variant.is_expiring_soon
                                                                ? 'bg-amber-50/60'
                                                                : undefined,
                                                    )}
                                                >
                                                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[#7c6f8a]">
                                                        {variant.sku}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-[#3b2d4a]">
                                                        {variant.label ?? '—'}
                                                        {variant.is_default ? (
                                                            <span className="ml-1.5 text-[10px] font-semibold uppercase text-[#7c3aed]">
                                                                Principal
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-[#4c1d95]">
                                                        {formatQty(
                                                            variant.quantity_on_hand,
                                                        )}
                                                        {variant.is_out_of_stock ? (
                                                            <span className="mt-0.5 block text-[10px] font-semibold text-rose-700">
                                                                Agotado
                                                            </span>
                                                        ) : variant.is_low_stock ? (
                                                            <span className="mt-0.5 block text-[10px] font-semibold text-amber-700">
                                                                Bajo mínimo
                                                            </span>
                                                        ) : variant.is_expired ? (
                                                            <span className="mt-0.5 block text-[10px] font-semibold text-rose-700">
                                                                Vencido
                                                            </span>
                                                        ) : variant.is_expiring_soon ? (
                                                            <span className="mt-0.5 block text-[10px] font-semibold text-orange-700">
                                                                {expiryStatusLabel(
                                                                    variant.expires_at,
                                                                    variant.is_expired,
                                                                    variant.is_expiring_soon,
                                                                    variant.days_until_expiry,
                                                                )}
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                    <td className="hidden whitespace-nowrap px-3 py-2.5 text-right text-[#6b5b7a] sm:table-cell">
                                                        {formatQty(
                                                            variant.minimum_stock,
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-2.5 text-right text-[#6b5b7a]">
                                                        S/{' '}
                                                        {formatMoney(
                                                            variant.avg_cost,
                                                        )}
                                                    </td>
                                                    <td className="hidden whitespace-nowrap px-3 py-2.5 text-right font-medium text-[#3b2d4a] md:table-cell">
                                                        S/{' '}
                                                        {formatMoney(
                                                            variant.stock_value,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                    </>
                )}
            </AppModalBody>
            <AppModalFooter>
                {warehouseId ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer rounded-lg border-violet-200 text-[#6d28d9] hover:bg-violet-50"
                        asChild
                    >
                        <Link
                            href={`/admin/inventario/saldos?warehouse_id=${warehouseId}`}
                        >
                            <ExternalLink className="mr-1.5 size-3.5" />
                            Ir a Stock Por almacen
                        </Link>
                    </Button>
                ) : null}
                <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer rounded-lg border-violet-200 text-[#5b21b6] hover:bg-violet-50"
                    onClick={() => onOpenChange(false)}
                >
                    Cerrar
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}
