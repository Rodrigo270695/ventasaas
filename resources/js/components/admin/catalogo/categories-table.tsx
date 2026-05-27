import { CornerDownRight, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
    orderCategoriesHierarchically,
    type CategoryTreeRow,
} from '@/lib/category-tree';
import { cn } from '@/lib/utils';
import type { CategoryRow } from '@/types/admin/categories';

export type CategoryTableAbilities = {
    canUpdate: boolean;
    canDelete: boolean;
};

type Props = {
    categories: CategoryRow[];
    abilities: CategoryTableAbilities;
    onEdit: (category: CategoryRow) => void;
    onDelete: (category: CategoryRow) => void;
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

function CategoryNameCell({ row }: { row: CategoryTreeRow }) {
    return (
        <span
            className="flex min-w-0 items-center gap-1.5"
            style={{ paddingLeft: `${row.depth * 1.25}rem` }}
        >
            {row.depth > 0 ? (
                <CornerDownRight
                    className="size-3.5 shrink-0 text-violet-400"
                    aria-hidden
                />
            ) : (
                <span className="size-3.5 shrink-0" aria-hidden />
            )}
            <span className="truncate">{row.name}</span>
        </span>
    );
}

function canDeleteCategory(category: CategoryRow): boolean {
    return category.children_count === 0;
}

export function CategoriesTable({
    categories,
    abilities,
    onEdit,
    onDelete,
    onFilteredCountChange,
}: Props) {
    const hasActions = abilities.canUpdate || abilities.canDelete;

    const hierarchicalData = useMemo(
        () => orderCategoriesHierarchically(categories),
        [categories],
    );

    const columns = useMemo<DataTableColumn<CategoryTreeRow>[]>(
        () => [
            {
                id: 'name',
                header: 'Categoría',
                primary: true,
                sortable: false,
                cell: (row) => <CategoryNameCell row={row} />,
                cellClassName: 'font-semibold text-[#3b2d4a]',
            },
            {
                id: 'code',
                header: 'Código',
                mobileLabel: 'Código',
                sortable: false,
                cell: (row) => row.code,
                cellClassName: 'font-mono text-sm text-[#7c6f8a]',
            },
            {
                id: 'parent',
                header: 'Padre',
                mobileLabel: 'Categoría padre',
                hideOnMobile: true,
                sortable: false,
                cell: (row) =>
                    row.depth > 0 ? (row.parent_name ?? '—') : '—',
                cellClassName: 'text-[#7c6f8a]',
            },
            {
                id: 'status',
                header: 'Estado',
                mobileLabel: 'Estado',
                sortable: false,
                cell: (row) => <StatusBadge active={row.is_active} />,
            },
        ],
        [],
    );

    const getSearchText = useCallback(
        (row: CategoryTreeRow) =>
            `${row.name} ${row.code} ${row.parent_name ?? ''} ${row.is_active ? 'activa' : 'inactiva'}`,
        [],
    );

    const renderActions = useCallback(
        (category: CategoryTreeRow) => {
            const deleteDisabled = !canDeleteCategory(category);

            return (
                <>
                    {abilities.canUpdate && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                            onClick={() => onEdit(category)}
                            aria-label={`Editar ${category.name}`}
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
                            onClick={() => onDelete(category)}
                            disabled={deleteDisabled}
                            aria-label={
                                deleteDisabled
                                    ? `No se puede eliminar ${category.name}`
                                    : `Eliminar ${category.name}`
                            }
                            title={
                                deleteDisabled
                                    ? 'Elimina las subcategorías antes'
                                    : undefined
                            }
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    )}
                </>
            );
        },
        [abilities, onEdit, onDelete],
    );

    return (
        <DataTable
            data={hierarchicalData}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar categoría…"
            emptyMessage="No hay categorías. Crea la primera con «Nueva categoría»."
            emptyFilteredMessage="Ninguna categoría coincide con tu búsqueda."
            renderActions={hasActions ? renderActions : undefined}
            onFilteredCountChange={onFilteredCountChange}
            defaultSort={null}
            className="min-w-0 [&_table]:table-fixed"
        />
    );
}
