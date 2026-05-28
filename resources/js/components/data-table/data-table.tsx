import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DataTableMobileList } from '@/components/data-table/data-table-mobile-list';
import { DataTableMobileScroll } from '@/components/data-table/data-table-mobile-scroll';
import { DataTableMobileToolbar } from '@/components/data-table/data-table-mobile-toolbar';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { DataTableCell } from '@/components/data-table/data-table-cell';
import { DataTableSearch } from '@/components/data-table/data-table-search';
import { DataTableSortHeader } from '@/components/data-table/data-table-sort-header';
import type { DataTableColumn } from '@/components/data-table/types';
import { useFilteredList } from '@/hooks/use-filtered-list';
import {
    DEFAULT_PAGE_SIZE,
    usePagination,
    type PageSizeOption,
} from '@/hooks/use-pagination';
import {
    toggleSort,
    useSortedList,
    type SortState,
} from '@/hooks/use-sorted-list';
import { cn } from '@/lib/utils';

/** expandable: filas con detalle (escala a muchas columnas). scroll: tabla horizontal. */
export type DataTableMobileLayout = 'expandable' | 'scroll';

type Props<T> = {
    data: T[];
    columns: DataTableColumn<T>[];
    getRowKey: (row: T) => string | number;
    getSearchText: (row: T) => string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    emptyFilteredMessage?: string;
    renderActions?: (row: T) => ReactNode;
    actionsHeader?: string;
    className?: string;
    defaultSort?: SortState;
    /** Vista móvil por defecto: lista expandible */
    mobileLayout?: DataTableMobileLayout;
    /** Activar paginación (por defecto sí) */
    paginated?: boolean;
    /** Tamaño de página inicial */
    defaultPageSize?: PageSizeOption;
    /** Total de filas tras filtrar/ordenar (útil para badges en la página) */
    onFilteredCountChange?: (count: number) => void;
    /** Controles alineados a la derecha del buscador (filtros, etc.). */
    toolbarEnd?: ReactNode;
    /** Búsqueda controlada por el servidor (sin filtro local en la tabla). */
    serverSearch?: {
        value: string;
        onChange: (value: string) => void;
        onCommit: (value?: string) => void;
        placeholder?: string;
    };
    /** Clases adicionales por fila (solo tabla escritorio). */
    getRowClassName?: (row: T) => string | undefined;
};

export function DataTable<T>({
    data,
    columns,
    getRowKey,
    getSearchText,
    searchPlaceholder = 'Buscar…',
    emptyMessage = 'No hay registros.',
    emptyFilteredMessage = 'No se encontraron resultados.',
    renderActions,
    actionsHeader = 'Acciones',
    className,
    defaultSort = null,
    mobileLayout = 'expandable',
    paginated = true,
    defaultPageSize = DEFAULT_PAGE_SIZE,
    onFilteredCountChange,
    toolbarEnd,
    serverSearch,
    getRowClassName,
}: Props<T>) {
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<SortState>(defaultSort);

    const visibleColumns = useMemo(
        () => columns.filter((col) => !col.hideOnMobile),
        [columns],
    );

    const getSearchTextStable = useCallback(
        (row: T) => getSearchText(row),
        [getSearchText],
    );

    const searchQuery = serverSearch ? '' : query;

    const { filteredItems, isPending, hasActiveFilter } = useFilteredList({
        items: data,
        query: searchQuery,
        getSearchText: getSearchTextStable,
    });

    const sortedItems = useSortedList({
        items: filteredItems,
        sort,
        columns,
    });

    const {
        paginatedItems,
        page,
        setPage,
        pageSize,
        setPageSize,
        totalItems,
        totalPages,
        rangeStart,
        rangeEnd,
    } = usePagination(sortedItems, { initialPageSize: defaultPageSize });

    const displayItems = paginated ? paginatedItems : sortedItems;

    useEffect(() => {
        onFilteredCountChange?.(sortedItems.length);
    }, [sortedItems.length, onFilteredCountChange]);

    useEffect(() => {
        if (paginated) {
            setPage(1);
        }
    }, [searchQuery, paginated, setPage]);

    const handleSort = useCallback((columnId: string) => {
        setSort((current) => toggleSort(current, columnId));
    }, []);

    const handleSortColumnChange = useCallback((columnId: string) => {
        if (!columnId) {
            setSort(null);

            return;
        }

        setSort((current) =>
            current?.columnId === columnId
                ? current
                : { columnId, direction: 'asc' },
        );
    }, []);

    const handleSortDirectionToggle = useCallback(() => {
        setSort((current) => {
            if (!current) {
                return null;
            }

            return {
                ...current,
                direction: current.direction === 'asc' ? 'desc' : 'asc',
            };
        });
    }, []);

    const primaryColumn =
        visibleColumns.find((c) => c.primary) ?? visibleColumns[0];
    const detailColumns = visibleColumns.filter(
        (col) => col.id !== primaryColumn?.id,
    );
    const sortableColumns = columns.filter(
        (col) => col.sortable && col.sortValue,
    );

    if (data.length === 0 && !toolbarEnd && !serverSearch) {
        return (
            <p className="rounded-xl border border-dashed border-violet-200 bg-white/60 px-4 py-8 text-center text-sm text-[#9d8fb0]">
                {emptyMessage}
            </p>
        );
    }

    const toolbar = (
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
            <DataTableSearch
                value={serverSearch ? serverSearch.value : query}
                onChange={serverSearch ? serverSearch.onChange : setQuery}
                onCommit={serverSearch?.onCommit}
                placeholder={serverSearch?.placeholder ?? searchPlaceholder}
                resultCount={
                    serverSearch || hasActiveFilter
                        ? sortedItems.length
                        : undefined
                }
                isSearching={isPending}
                className="w-full max-w-none xl:min-w-0 xl:flex-1"
            />
            {toolbarEnd ? (
                <div className="w-full shrink-0 xl:w-auto">{toolbarEnd}</div>
            ) : null}
        </div>
    );

    if (data.length === 0) {
        return (
            <div data-tour="page-table" className={cn('space-y-2', className)}>
                {toolbar}
                <p className="rounded-xl border border-dashed border-violet-200 bg-white/60 px-4 py-8 text-center text-sm text-[#9d8fb0]">
                    {emptyMessage}
                </p>
            </div>
        );
    }

    return (
        <div data-tour="page-table" className={cn('space-y-2', className)}>
            {toolbar}

            {sortedItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-violet-200 bg-white/60 px-4 py-8 text-center text-sm text-[#9d8fb0]">
                    {hasActiveFilter ? emptyFilteredMessage : emptyMessage}
                </p>
            ) : (
                <div
                    className={cn(
                        'flex flex-col overflow-visible rounded-2xl border border-violet-100/80 bg-white/80 shadow-sm',
                        isPending && 'opacity-90',
                    )}
                >
                    {/* Escritorio */}
                    <div className="hidden md:block md:overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-violet-100/80 bg-violet-50/50 text-xs font-bold tracking-wide text-[#7c3aed] uppercase">
                                    {columns.map((col) => (
                                        <th
                                            key={col.id}
                                            className={cn(
                                                'px-3 py-2',
                                                col.headerClassName,
                                            )}
                                        >
                                            {col.sortable && col.sortValue ? (
                                                <DataTableSortHeader
                                                    label={col.header}
                                                    columnId={col.id}
                                                    sort={sort}
                                                    onSort={handleSort}
                                                    align={
                                                        col.headerClassName?.includes(
                                                            'text-right',
                                                        )
                                                            ? 'right'
                                                            : 'left'
                                                    }
                                                />
                                            ) : (
                                                col.header
                                            )}
                                        </th>
                                    ))}
                                    {renderActions && (
                                        <th
                                            data-tour="page-actions"
                                            className="w-24 px-3 py-2 text-right"
                                        >
                                            {actionsHeader}
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {displayItems.map((row) => (
                                    <tr
                                        key={getRowKey(row)}
                                        className={cn(
                                            'border-b border-violet-50/80 last:border-0 hover:bg-violet-50/30',
                                            getRowClassName?.(row),
                                        )}
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.id}
                                                className={cn(
                                                    'max-w-0 px-3 py-2',
                                                    col.cellClassName,
                                                )}
                                            >
                                                <DataTableCell
                                                    truncate={col.truncate}
                                                    title={
                                                        col.truncate &&
                                                        typeof col.sortValue?.(
                                                            row,
                                                        ) === 'string'
                                                            ? String(
                                                                  col.sortValue(
                                                                      row,
                                                                  ),
                                                              )
                                                            : undefined
                                                    }
                                                >
                                                    {col.cell(row)}
                                                </DataTableCell>
                                            </td>
                                        ))}
                                        {renderActions && (
                                            <td className="w-24 px-2 py-2">
                                                <div className="flex justify-end gap-1">
                                                    {renderActions(row)}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Móvil: scroll natural de la página (sin altura fija) */}
                    <div className="md:hidden">
                        <DataTableMobileToolbar
                            sortableColumns={sortableColumns}
                            sort={sort}
                            onSortColumnChange={handleSortColumnChange}
                            onSortDirectionToggle={handleSortDirectionToggle}
                            resultCount={totalItems}
                        />

                        {primaryColumn &&
                            (mobileLayout === 'scroll' ? (
                                <DataTableMobileScroll
                                    rows={displayItems}
                                    columns={visibleColumns}
                                    getRowKey={getRowKey}
                                    sort={sort}
                                    onSort={handleSort}
                                    renderActions={renderActions}
                                    actionsHeader={actionsHeader}
                                    primaryColumnId={primaryColumn.id}
                                />
                            ) : (
                                <DataTableMobileList
                                    rows={displayItems}
                                    primaryColumn={primaryColumn}
                                    detailColumns={detailColumns}
                                    getRowKey={getRowKey}
                                    renderActions={renderActions}
                                />
                            ))}
                    </div>

                    {paginated && (
                        <DataTablePagination
                            page={page}
                            pageSize={pageSize}
                            totalItems={totalItems}
                            totalPages={totalPages}
                            rangeStart={rangeStart}
                            rangeEnd={rangeEnd}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
