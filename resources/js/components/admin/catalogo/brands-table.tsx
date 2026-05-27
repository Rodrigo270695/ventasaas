import { Pencil, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BrandRow } from '@/types/admin/brands';

export type BrandTableAbilities = {
    canUpdate: boolean;
    canDelete: boolean;
};

type Props = {
    brands: BrandRow[];
    abilities: BrandTableAbilities;
    onEdit: (brand: BrandRow) => void;
    onDelete: (brand: BrandRow) => void;
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

export function BrandsTable({
    brands,
    abilities,
    onEdit,
    onDelete,
    onFilteredCountChange,
}: Props) {
    const hasActions = abilities.canUpdate || abilities.canDelete;

    const columns = useMemo<DataTableColumn<BrandRow>[]>(
        () => [
            {
                id: 'name',
                header: 'Marca',
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
        (row: BrandRow) =>
            `${row.name} ${row.code} ${row.is_active ? 'activa' : 'inactiva'}`,
        [],
    );

    const renderActions = useCallback(
        (brand: BrandRow) => (
            <>
                {abilities.canUpdate && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                        onClick={() => onEdit(brand)}
                        aria-label={`Editar ${brand.name}`}
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
                        onClick={() => onDelete(brand)}
                        aria-label={`Eliminar ${brand.name}`}
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
            data={brands}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar marca…"
            emptyMessage="No hay marcas. Crea la primera con «Nueva marca»."
            emptyFilteredMessage="Ninguna marca coincide con tu búsqueda."
            renderActions={hasActions ? renderActions : undefined}
            onFilteredCountChange={onFilteredCountChange}
            className="min-w-0 [&_table]:table-fixed"
        />
    );
}
