import { Lock } from 'lucide-react';
import { useCallback, useMemo, type ReactNode } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CashRegisterSessionRow } from '@/types/admin/treasury';

type Props = {
    sessions: CashRegisterSessionRow[];
    onClose: (session: CashRegisterSessionRow) => void;
    onFilteredCountChange?: (count: number) => void;
    toolbarEnd?: ReactNode;
};

export function CashSessionsTable({
    sessions,
    onClose,
    onFilteredCountChange,
    toolbarEnd,
}: Props) {
    const columns = useMemo<DataTableColumn<CashRegisterSessionRow>[]>(
        () => [
            {
                id: 'register',
                header: 'Caja',
                primary: true,
                sortable: true,
                sortValue: (row) => row.cash_register_name ?? '',
                cell: (row) => (
                    <span>
                        <span className="font-semibold text-[#3b2d4a]">
                            {row.cash_register_name}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-[#6b5b7a]">
                            {row.cash_register_code}
                        </span>
                    </span>
                ),
            },
            {
                id: 'opened',
                header: 'Apertura',
                sortable: true,
                sortValue: (row) => row.opened_at_label,
                cell: (row) => (
                    <span>
                        {row.opened_at_label}
                        <span className="mt-0.5 block text-xs text-[#6b5b7a]">
                            {row.opened_by_name}
                        </span>
                    </span>
                ),
            },
            {
                id: 'status',
                header: 'Estado',
                cell: (row) => (
                    <span
                        className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                            row.status === 'open'
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
                                : 'bg-slate-100 text-slate-600',
                        )}
                    >
                        {row.status_label}
                    </span>
                ),
            },
            {
                id: 'expected',
                header: 'Efectivo esperado',
                align: 'right',
                cell: (row) =>
                    row.expected_cash_label ? (
                        <span className="font-mono text-sm">
                            PEN {row.expected_cash_label}
                        </span>
                    ) : (
                        '—'
                    ),
            },
            {
                id: 'difference',
                header: 'Diferencia',
                align: 'right',
                cell: (row) =>
                    row.cash_difference_label ? (
                        <span
                            className={cn(
                                'font-mono text-sm font-semibold',
                                parseFloat(row.cash_difference_label.replace(/,/g, '')) !== 0
                                    ? 'text-amber-700'
                                    : 'text-emerald-700',
                            )}
                        >
                            PEN {row.cash_difference_label}
                        </span>
                    ) : (
                        '—'
                    ),
            },
        ],
        [],
    );

    const renderActions = useCallback(
        (row: CashRegisterSessionRow) =>
            row.can_close ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 cursor-pointer rounded-lg text-amber-700 transition-all duration-200 hover:bg-amber-600 hover:text-white hover:shadow-md hover:shadow-amber-300/40 active:scale-95"
                    onClick={() => onClose(row)}
                >
                    <Lock className="h-4 w-4" />
                    <span className="sr-only">Cerrar sesión</span>
                </Button>
            ) : null,
        [onClose],
    );

    return (
        <DataTable
            data={sessions}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={(row) =>
                [
                    row.cash_register_name,
                    row.cash_register_code,
                    row.opened_by_name,
                    row.closed_by_name,
                ]
                    .filter(Boolean)
                    .join(' ')
            }
            searchPlaceholder="Buscar sesión…"
            emptyMessage="No hay sesiones de caja."
            renderActions={renderActions}
            actionsHeader="Acciones"
            onFilteredCountChange={onFilteredCountChange}
            defaultSort={{ columnId: 'opened', direction: 'desc' }}
            toolbarEnd={toolbarEnd}
        />
    );
}
