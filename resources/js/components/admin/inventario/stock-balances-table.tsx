import { SlidersHorizontal } from 'lucide-react';
import { useCallback, useMemo, type ReactNode } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { formatDecimalDisplay } from '@/lib/format-decimal';
import { cn } from '@/lib/utils';
import type { StockBalanceRow } from '@/types/admin/stock-balances';

type Props = {
    balances: StockBalanceRow[];
    canAdjust: boolean;
    onAdjust: (row: StockBalanceRow) => void;
    onFilteredCountChange?: (count: number) => void;
    toolbarEnd?: ReactNode;
};

function formatQty(value: string): string {
    return formatDecimalDisplay(value) || value;
}

function formatMoney(value: string): string {
    return formatDecimalDisplay(value) || value;
}

export function StockBalancesTable({
    balances,
    canAdjust,
    onAdjust,
    onFilteredCountChange,
    toolbarEnd,
}: Props) {
    const columns = useMemo<DataTableColumn<StockBalanceRow>[]>(
        () => [
            {
                id: 'product',
                header: 'Producto',
                primary: true,
                sortable: true,
                sortValue: (row) => row.product_name ?? '',
                truncate: true,
                headerClassName: 'w-[16rem]',
                cell: (row) => (
                    <span className="block min-w-0" title={row.product_name ?? undefined}>
                        <span className="block truncate">{row.product_name ?? '—'}</span>
                        {row.variant_label ? (
                            <span className="mt-0.5 block truncate text-xs font-normal text-[#6b5b7a]">
                                {row.variant_label}
                            </span>
                        ) : null}
                    </span>
                ),
                cellClassName: 'min-w-0 font-semibold text-[#3b2d4a]',
            },
            {
                id: 'sku',
                header: 'SKU',
                mobileLabel: 'SKU',
                sortable: true,
                sortValue: (row) => row.variant_sku ?? '',
                headerClassName: 'w-[8rem] whitespace-nowrap',
                cellClassName: 'whitespace-nowrap font-mono text-sm text-[#7c6f8a]',
                cell: (row) => row.variant_sku ?? '—',
            },
            {
                id: 'qty',
                header: 'Stock',
                mobileLabel: 'Stock',
                sortable: true,
                sortValue: (row) => Number(row.quantity_on_hand),
                headerClassName: 'w-[7rem] text-right',
                cellClassName: 'text-right whitespace-nowrap font-semibold text-[#4c1d95]',
                cell: (row) => (
                    <span>
                        <span>{formatQty(row.quantity_on_hand)}</span>
                        {row.is_out_of_stock ? (
                            <span className="mt-0.5 block text-[10px] font-semibold text-rose-700">
                                Agotado
                            </span>
                        ) : row.is_low_stock ? (
                            <span className="mt-0.5 block text-[10px] font-semibold text-amber-700">
                                Bajo mínimo
                            </span>
                        ) : null}
                    </span>
                ),
            },
            {
                id: 'minimum',
                header: 'Mínimo',
                mobileLabel: 'Mínimo',
                sortable: true,
                sortValue: (row) => Number(row.minimum_stock),
                headerClassName: 'w-[7rem] text-right',
                cellClassName: 'text-right whitespace-nowrap text-sm font-medium text-[#6b5b7a]',
                cell: (row) => formatQty(row.minimum_stock),
            },
            {
                id: 'avg_cost',
                header: 'Costo prom.',
                mobileLabel: 'Costo',
                sortable: true,
                sortValue: (row) => Number(row.avg_cost),
                headerClassName: 'w-[8rem] text-right',
                cellClassName: 'text-right whitespace-nowrap text-sm text-[#6b5b7a]',
                cell: (row) => `S/ ${formatMoney(row.avg_cost)}`,
            },
            {
                id: 'value',
                header: 'Valor',
                mobileLabel: 'Valor',
                sortable: true,
                sortValue: (row) => Number(row.stock_value),
                headerClassName: 'w-[8rem] text-right',
                cellClassName: 'text-right whitespace-nowrap text-sm font-medium text-[#3b2d4a]',
                cell: (row) => `S/ ${formatMoney(row.stock_value)}`,
            },
        ],
        [],
    );

    const getSearchText = useCallback(
        (row: StockBalanceRow) =>
            `${row.product_name ?? ''} ${row.variant_sku ?? ''} ${row.variant_label ?? ''} ${row.quantity_on_hand}`,
        [],
    );

    const renderActions = useCallback(
        (row: StockBalanceRow) =>
            canAdjust ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                    onClick={() => onAdjust(row)}
                    aria-label="Ajustar stock"
                >
                    <SlidersHorizontal className="size-4" />
                </Button>
            ) : null,
        [canAdjust, onAdjust],
    );

    return (
        <DataTable
            data={balances}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar producto o SKU…"
            emptyMessage="No hay saldos en este almacén. Registra un ajuste de stock."
            emptyFilteredMessage="Ningún registro coincide con tu búsqueda."
            renderActions={canAdjust ? renderActions : undefined}
            onFilteredCountChange={onFilteredCountChange}
            toolbarEnd={toolbarEnd}
            getRowClassName={(row) =>
                row.is_out_of_stock
                    ? cn(
                          'bg-rose-50/70',
                          'hover:!bg-rose-100/80',
                      )
                    : row.is_low_stock
                      ? cn(
                            'bg-amber-50/70',
                            'hover:!bg-amber-100/80',
                        )
                      : undefined
            }
            className="min-w-0 [&_table]:table-fixed"
        />
    );
}
