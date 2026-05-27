import { Link } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { index as sessionsIndex } from '@/routes/admin/tesoreria/sesiones';
import type { CashRegisterRow } from '@/types/admin/treasury';

export type CashRegistersTableAbilities = {
    canUpdate: boolean;
    canDelete: boolean;
};

type Props = {
    registers: CashRegisterRow[];
    abilities: CashRegistersTableAbilities;
    onEdit: (row: CashRegisterRow) => void;
    onDelete: (row: CashRegisterRow) => void;
    onFilteredCountChange?: (count: number) => void;
};

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                active
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
                    : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
            )}
        >
            {active ? 'Activa' : 'Inactiva'}
        </span>
    );
}

export function CashRegistersTable({
    registers,
    abilities,
    onEdit,
    onDelete,
    onFilteredCountChange,
}: Props) {
    const hasActions = abilities.canUpdate || abilities.canDelete;

    const columns = useMemo<DataTableColumn<CashRegisterRow>[]>(
        () => [
            {
                id: 'name',
                header: 'Caja',
                primary: true,
                sortable: true,
                sortValue: (row) => row.name,
                cell: (row) => (
                    <span>
                        <span className="font-semibold text-[#3b2d4a]">
                            {row.name}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-[#6b5b7a]">
                            {row.code}
                        </span>
                    </span>
                ),
            },
            {
                id: 'warehouse',
                header: 'Almacén',
                sortable: true,
                sortValue: (row) => row.warehouse_name ?? '',
                cell: (row) => row.warehouse_name ?? '—',
                cellClassName: 'text-[#7c6f8a]',
            },
            {
                id: 'session',
                header: 'Sesión',
                cell: (row) =>
                    row.has_open_session ? (
                        <Link
                            href={sessionsIndex.url({
                                query: { status: 'open' },
                            })}
                            className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                            Abierta
                            {row.open_session_opened_at_label
                                ? ` · ${row.open_session_opened_at_label}`
                                : ''}
                        </Link>
                    ) : (
                        <span className="text-xs text-[#9d8fb0]">Cerrada</span>
                    ),
            },
            {
                id: 'status',
                header: 'Estado',
                sortable: true,
                sortValue: (row) => (row.is_active ? 1 : 0),
                cell: (row) => <StatusBadge active={row.is_active} />,
            },
        ],
        [],
    );

    const getSearchText = useCallback(
        (row: CashRegisterRow) =>
            [row.name, row.code, row.warehouse_name]
                .filter(Boolean)
                .join(' '),
        [],
    );

    const renderActions = useCallback(
        (row: CashRegisterRow) => (
            <>
                {abilities.canUpdate && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                        onClick={() => onEdit(row)}
                        aria-label={`Editar ${row.name}`}
                    >
                        <Pencil className="size-4" />
                    </Button>
                )}
                {abilities.canDelete && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer rounded-lg text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-300/40 active:scale-95"
                        onClick={() => onDelete(row)}
                        aria-label={`Eliminar ${row.name}`}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </>
        ),
        [abilities, onEdit, onDelete],
    );

    return (
        <DataTable
            data={registers}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar caja…"
            emptyMessage="No hay cajas registradas."
            emptyFilteredMessage="Ninguna caja coincide con tu búsqueda."
            renderActions={hasActions ? renderActions : undefined}
            onFilteredCountChange={onFilteredCountChange}
        />
    );
}
