import { Pencil, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PaymentMethodRow } from '@/types/admin/treasury';

export type PaymentMethodsTableAbilities = {
    canUpdate: boolean;
    canDelete: boolean;
};

type Props = {
    methods: PaymentMethodRow[];
    abilities: PaymentMethodsTableAbilities;
    onEdit: (method: PaymentMethodRow) => void;
    onDelete: (method: PaymentMethodRow) => void;
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
            {active ? 'Activo' : 'Inactivo'}
        </span>
    );
}

export function PaymentMethodsTable({
    methods,
    abilities,
    onEdit,
    onDelete,
    onFilteredCountChange,
}: Props) {
    const hasActions = abilities.canUpdate || abilities.canDelete;

    const columns = useMemo<DataTableColumn<PaymentMethodRow>[]>(
        () => [
            {
                id: 'name',
                header: 'Método',
                primary: true,
                sortable: true,
                sortValue: (row) => row.name,
                cell: (row) => (
                    <span>
                        <span className="font-semibold text-[#3b2d4a]">
                            {row.name}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs font-normal text-[#6b5b7a]">
                            {row.code}
                        </span>
                    </span>
                ),
            },
            {
                id: 'type',
                header: 'Tipo',
                sortable: true,
                sortValue: (row) => row.type_label,
                cell: (row) => row.type_label,
                cellClassName: 'text-[#7c6f8a]',
            },
            {
                id: 'sort',
                header: 'Orden',
                align: 'right',
                sortable: true,
                sortValue: (row) => row.sort_order,
                cell: (row) => row.sort_order,
                cellClassName: 'font-mono text-sm text-[#7c6f8a]',
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
        (row: PaymentMethodRow) =>
            `${row.name} ${row.code} ${row.type_label} ${row.is_active ? 'activo' : 'inactivo'}`,
        [],
    );

    const renderActions = useCallback(
        (row: PaymentMethodRow) => (
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
                        className="size-8 cursor-pointer rounded-lg text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-300/40 active:scale-95"
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
            data={methods}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar método…"
            emptyMessage="No hay métodos de pago. Crea el primero con «Nuevo método»."
            emptyFilteredMessage="Ningún método coincide con tu búsqueda."
            defaultSort={{ columnId: 'sort', direction: 'asc' }}
            renderActions={hasActions ? renderActions : undefined}
            actionsHeader={hasActions ? 'Acciones' : undefined}
            onFilteredCountChange={onFilteredCountChange}
        />
    );
}
