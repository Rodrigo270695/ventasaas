import { Pencil, Star, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PriceListRow } from '@/types/admin/price-lists';

export type PriceListTableAbilities = {
    canUpdate: boolean;
    canDelete: boolean;
};

type Props = {
    priceLists: PriceListRow[];
    abilities: PriceListTableAbilities;
    onEdit: (priceList: PriceListRow) => void;
    onDelete: (priceList: PriceListRow) => void;
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

export function PriceListsTable({
    priceLists,
    abilities,
    onEdit,
    onDelete,
    onFilteredCountChange,
}: Props) {
    const hasActions = abilities.canUpdate || abilities.canDelete;

    const columns = useMemo<DataTableColumn<PriceListRow>[]>(
        () => [
            {
                id: 'name',
                header: 'Lista',
                primary: true,
                sortable: true,
                sortValue: (row) => row.name,
                truncate: true,
                cell: (row) => (
                    <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#3b2d4a]">
                            {row.name}
                        </span>
                        {row.is_default && (
                            <Star className="size-3.5 shrink-0 fill-[#7c3aed] text-[#7c3aed]" />
                        )}
                    </div>
                ),
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
                id: 'currency',
                header: 'Moneda',
                mobileLabel: 'Moneda',
                sortable: true,
                sortValue: (row) => row.currency_code,
                cell: (row) => row.currency_code,
                cellClassName: 'font-mono text-sm',
            },
            {
                id: 'prices_count',
                header: 'Precios',
                mobileLabel: 'Precios',
                sortable: true,
                sortValue: (row) => row.prices_count,
                cell: (row) => (
                    <span className="tabular-nums">{row.prices_count}</span>
                ),
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
        (row: PriceListRow) =>
            `${row.name} ${row.code} ${row.currency_code} ${row.is_active ? 'activa' : 'inactiva'}`,
        [],
    );

    const renderActions = useCallback(
        (priceList: PriceListRow) => (
            <>
                {abilities.canUpdate && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                        onClick={() => onEdit(priceList)}
                        aria-label={`Editar ${priceList.name}`}
                    >
                        <Pencil className="size-4" />
                    </Button>
                )}
                {abilities.canDelete && !priceList.is_default && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-300/40 active:scale-95"
                        onClick={() => onDelete(priceList)}
                        aria-label={`Eliminar ${priceList.name}`}
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
            data={priceLists}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar lista…"
            emptyMessage="No hay listas. Crea la primera con «Nueva lista»."
            emptyFilteredMessage="Ninguna lista coincide con tu búsqueda."
            renderActions={hasActions ? renderActions : undefined}
            onFilteredCountChange={onFilteredCountChange}
            className="min-w-0 [&_table]:table-fixed"
        />
    );
}
