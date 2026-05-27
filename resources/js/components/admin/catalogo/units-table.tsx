import { Pencil, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UnitRow } from '@/types/admin/units';

export type UnitTableAbilities = {
    canUpdate: boolean;
    canDelete: boolean;
};

type Props = {
    units: UnitRow[];
    abilities: UnitTableAbilities;
    onEdit: (unit: UnitRow) => void;
    onDelete: (unit: UnitRow) => void;
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

export function UnitsTable({
    units,
    abilities,
    onEdit,
    onDelete,
    onFilteredCountChange,
}: Props) {
    const hasActions = abilities.canUpdate || abilities.canDelete;

    const columns = useMemo<DataTableColumn<UnitRow>[]>(
        () => [
            {
                id: 'name',
                header: 'Unidad',
                primary: true,
                sortable: true,
                sortValue: (row) => row.name,
                truncate: true,
                cell: (row) => row.name,
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
                id: 'sunat',
                header: 'SUNAT',
                mobileLabel: 'SUNAT',
                sortable: true,
                sortValue: (row) => row.sunat_code ?? '',
                cell: (row) => row.sunat_code ?? '—',
                cellClassName: 'text-[#7c6f8a]',
            },
            {
                id: 'symbol',
                header: 'Símbolo',
                mobileLabel: 'Símbolo',
                sortable: true,
                sortValue: (row) => row.symbol ?? '',
                truncate: true,
                cell: (row) => row.symbol ?? '—',
                cellClassName: 'text-[#7c6f8a]',
            },
            {
                id: 'decimals',
                header: 'Decimales',
                mobileLabel: 'Decimales',
                sortable: true,
                sortValue: (row) => (row.allows_decimals ? 1 : 0),
                cell: (row) => (row.allows_decimals ? 'Sí' : 'No'),
                cellClassName: 'text-[#7c6f8a]',
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
        (row: UnitRow) =>
            `${row.name} ${row.code} ${row.sunat_code ?? ''} ${row.symbol ?? ''} ${row.is_active ? 'activa' : 'inactiva'}`,
        [],
    );

    const renderActions = useCallback(
        (unit: UnitRow) => (
            <>
                {abilities.canUpdate && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                        onClick={() => onEdit(unit)}
                        aria-label={`Editar ${unit.name}`}
                    >
                        <Pencil className="size-4" />
                    </Button>
                )}
                {abilities.canDelete && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-300/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-red-600/50 disabled:hover:shadow-none"
                        onClick={() => onDelete(unit)}
                        aria-label={`Eliminar ${unit.name}`}
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
            data={units}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar unidad…"
            emptyMessage="No hay unidades. Crea la primera con «Nueva unidad»."
            emptyFilteredMessage="Ninguna unidad coincide con tu búsqueda."
            renderActions={hasActions ? renderActions : undefined}
            onFilteredCountChange={onFilteredCountChange}
            className="min-w-0 [&_table]:table-fixed"
        />
    );
}
