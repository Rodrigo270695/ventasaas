import { Pencil, Star, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WarehouseRow } from '@/types/admin/warehouses';

export type WarehouseTableAbilities = {
    canUpdate: boolean;
    canDelete: boolean;
};

type Props = {
    warehouses: WarehouseRow[];
    abilities: WarehouseTableAbilities;
    onEdit: (warehouse: WarehouseRow) => void;
    onDelete: (warehouse: WarehouseRow) => void;
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

export function WarehousesTable({
    warehouses,
    abilities,
    onEdit,
    onDelete,
    onFilteredCountChange,
}: Props) {
    const hasActions = abilities.canUpdate || abilities.canDelete;

    const columns = useMemo<DataTableColumn<WarehouseRow>[]>(
        () => [
            {
                id: 'name',
                header: 'Almacén',
                primary: true,
                sortable: true,
                sortValue: (row) => row.name,
                truncate: true,
                cell: (row) => (
                    <span className="inline-flex items-center gap-1.5">
                        {row.name}
                        {row.is_default && (
                            <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-500" />
                        )}
                    </span>
                ),
                cellClassName: 'font-semibold text-[#3b2d4a]',
            },
            {
                id: 'code',
                header: 'Código',
                mobileLabel: 'Código',
                sortable: true,
                sortValue: (row) => row.code,
                cell: (row) => row.code,
                cellClassName: 'font-mono text-sm text-[#7c6f8a]',
            },
            {
                id: 'saleable',
                header: 'Ventas',
                mobileLabel: 'Ventas',
                sortable: true,
                sortValue: (row) => (row.is_saleable ? 1 : 0),
                cell: (row) => (row.is_saleable ? 'Sí' : 'No'),
                cellClassName: 'text-sm text-[#6b5b7a]',
            },
            {
                id: 'status',
                header: 'Estado',
                mobileLabel: 'Estado',
                sortable: true,
                sortValue: (row) => (row.is_active ? 1 : 0),
                cell: (row) => <StatusBadge active={row.is_active} />,
            },
        ],
        [],
    );

    const getSearchText = useCallback(
        (row: WarehouseRow) =>
            `${row.name} ${row.code} ${row.is_active ? 'activo' : 'inactivo'} ${row.is_default ? 'defecto' : ''}`,
        [],
    );

    const renderActions = useCallback(
        (warehouse: WarehouseRow) => (
            <>
                {abilities.canUpdate && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                        onClick={() => onEdit(warehouse)}
                        aria-label={`Editar ${warehouse.name}`}
                    >
                        <Pencil className="size-4" />
                    </Button>
                )}
                {abilities.canDelete && !warehouse.is_default && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer rounded-lg text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-300/40 active:scale-95"
                        onClick={() => onDelete(warehouse)}
                        aria-label={`Eliminar ${warehouse.name}`}
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
            data={warehouses}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar almacén…"
            emptyMessage="No hay almacenes. Crea el primero con «Nuevo almacén»."
            emptyFilteredMessage="Ningún almacén coincide con tu búsqueda."
            renderActions={hasActions ? renderActions : undefined}
            onFilteredCountChange={onFilteredCountChange}
        />
    );
}
