import { useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { formatDecimalDisplay } from '@/lib/format-decimal';
import { cn } from '@/lib/utils';
import type { StockMovementRow } from '@/types/admin/stock-movements';

type Props = {
    movements: StockMovementRow[];
    showBalanceColumn: boolean;
    onFilteredCountChange?: (count: number) => void;
};

function formatMoney(value: string): string {
    return formatDecimalDisplay(value) || value;
}

function TypeBadge({ label, type }: { label: string; type: string | null }) {
    const tone =
        type === 'opening'
            ? 'bg-cyan-50 text-cyan-800 ring-cyan-200/80'
            : type === 'adjustment'
              ? 'bg-violet-50 text-violet-800 ring-violet-200/80'
              : type === 'purchase_in'
                ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
                : type === 'sale_out'
                  ? 'bg-amber-50 text-amber-800 ring-amber-200/80'
                  : type === 'transfer_out' || type === 'transfer_in'
                    ? 'bg-blue-50 text-blue-800 ring-blue-200/80'
                    : type === 'breakdown'
                    ? 'bg-pink-50 text-pink-800 ring-pink-200/80'
                    : type === 'cost_update'
                      ? 'bg-orange-50 text-orange-800 ring-orange-200/80'
                      : 'bg-slate-50 text-slate-700 ring-slate-200/80';

    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1',
                tone,
            )}
        >
            {label}
        </span>
    );
}

export function StockMovementsTable({
    movements,
    showBalanceColumn,
    onFilteredCountChange,
}: Props) {
    const columns = useMemo<DataTableColumn<StockMovementRow>[]>(() => {
        const base: DataTableColumn<StockMovementRow>[] = [
            {
                id: 'date',
                header: 'Fecha',
                mobileLabel: 'Fecha',
                sortable: true,
                sortValue: (row) =>
                    row.movement_date_sort ??
                    (row.movement_date
                        ? new Date(row.movement_date).getTime()
                        : 0),
                headerClassName: 'w-[8.75rem] whitespace-nowrap',
                cell: (row) => row.movement_date_label ?? '—',
                cellClassName: 'text-sm text-[#5c4d6b] whitespace-nowrap',
            },
            {
                id: 'document',
                header: 'Documento',
                mobileLabel: 'Doc.',
                sortable: true,
                sortValue: (row) => row.document_number ?? '',
                headerClassName: 'w-[10rem]',
                cell: (row) => (
                    <span className="font-mono text-xs text-[#7c6f8a]">
                        {row.document_number ?? '—'}
                    </span>
                ),
            },
            {
                id: 'type',
                header: 'Tipo',
                mobileLabel: 'Tipo',
                sortable: true,
                sortValue: (row) => row.movement_type ?? '',
                headerClassName: 'w-[9rem] whitespace-nowrap',
                cellClassName: 'whitespace-nowrap',
                cell: (row) => (
                    <TypeBadge
                        label={row.movement_type_label}
                        type={row.movement_type}
                    />
                ),
            },
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
                        {row.variant_label || row.variant_sku ? (
                            <span className="mt-0.5 block truncate text-xs font-normal text-[#6b5b7a]">
                                {[row.variant_label, row.variant_sku]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </span>
                        ) : null}
                    </span>
                ),
                cellClassName: 'font-semibold text-[#3b2d4a]',
            },
            {
                id: 'warehouse',
                header: 'Almacén',
                mobileLabel: 'Almacén',
                sortable: true,
                sortValue: (row) => row.warehouse_name ?? '',
                hideOnMobile: true,
                headerClassName: 'w-[11rem]',
                cell: (row) =>
                    row.warehouse_code
                        ? `${row.warehouse_name} (${row.warehouse_code})`
                        : (row.warehouse_name ?? '—'),
                cellClassName: 'text-sm text-[#6b5b7a]',
            },
            {
                id: 'quantity',
                header: 'Cantidad',
                mobileLabel: 'Cant.',
                sortable: true,
                sortValue: (row) => Number(row.quantity),
                headerClassName: 'w-[7rem] text-right',
                cellClassName: 'text-right whitespace-nowrap',
                cell: (row) => (
                    <span
                        className={cn(
                            'font-semibold tabular-nums',
                            row.is_inbound
                                ? 'text-emerald-700'
                                : 'text-amber-800',
                        )}
                    >
                        {row.quantity_label}
                    </span>
                ),
            },
            {
                id: 'unit_cost',
                header: 'Costo unit.',
                mobileLabel: 'Costo',
                sortable: true,
                sortValue: (row) => Number(row.unit_cost),
                hideOnMobile: true,
                headerClassName: 'w-[8rem] text-right',
                cellClassName: 'text-right whitespace-nowrap text-sm text-[#6b5b7a]',
                cell: (row) => `S/ ${formatMoney(row.unit_cost)}`,
            },
            {
                id: 'total_cost',
                header: 'Total',
                mobileLabel: 'Total',
                sortable: true,
                sortValue: (row) => Number(row.total_cost),
                hideOnMobile: true,
                headerClassName: 'w-[8rem] text-right',
                cellClassName: 'text-right whitespace-nowrap text-sm font-medium text-[#4c1d95]',
                cell: (row) => `S/ ${formatMoney(row.total_cost)}`,
            },
        ];

        if (showBalanceColumn) {
            base.push({
                id: 'balance',
                header: 'Saldo',
                mobileLabel: 'Saldo',
                sortable: true,
                sortValue: (row) => Number(row.balance_after ?? 0),
                headerClassName: 'w-[7rem] text-right',
                cell: (row) =>
                    row.balance_after != null
                        ? formatDecimalDisplay(row.balance_after)
                        : '—',
                cellClassName: 'text-right whitespace-nowrap font-semibold tabular-nums text-[#4c1d95]',
            });
        }

        base.push({
            id: 'user',
            header: 'Usuario',
            mobileLabel: 'Usuario',
            sortable: true,
            sortValue: (row) => row.created_by_name ?? '',
            hideOnMobile: true,
            headerClassName: 'w-[9rem]',
            cell: (row) => row.created_by_name ?? '—',
            cellClassName: 'text-sm text-[#6b5b7a]',
        });

        return base;
    }, [showBalanceColumn]);

    return (
        <DataTable
            data={movements}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={(row) =>
                [
                    row.document_number,
                    row.product_name,
                    row.variant_sku,
                    row.variant_label,
                    row.warehouse_name,
                    row.warehouse_code,
                    row.movement_type_label,
                    row.created_by_name,
                    row.notes,
                ]
                    .filter(Boolean)
                    .join(' ')
            }
            searchPlaceholder="Buscar documento, producto, SKU…"
            emptyMessage="Aún no hay movimientos de stock."
            emptyFilteredMessage="No hay movimientos con los filtros aplicados."
            defaultSort={{ columnId: 'date', direction: 'desc' }}
            onFilteredCountChange={onFilteredCountChange}
            className="min-w-0 [&_table]:table-fixed"
        />
    );
}
