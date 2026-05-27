import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DataTableSortHeader } from '@/components/data-table/data-table-sort-header';
import type { DataTableColumn } from '@/components/data-table/types';
import type { SortState } from '@/hooks/use-sorted-list';
import { cn } from '@/lib/utils';

type Props<T> = {
    rows: T[];
    columns: DataTableColumn<T>[];
    getRowKey: (row: T) => string | number;
    sort: SortState;
    onSort: (columnId: string) => void;
    renderActions?: (row: T) => ReactNode;
    actionsHeader?: string;
    primaryColumnId: string;
};

export function DataTableMobileScroll<T>({
    rows,
    columns,
    getRowKey,
    sort,
    onSort,
    renderActions,
    actionsHeader = 'Acciones',
    primaryColumnId,
}: Props<T>) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollHints = useCallback(() => {
        const el = scrollRef.current;

        if (!el) {
            return;
        }

        const { scrollLeft, scrollWidth, clientWidth } = el;
        setCanScrollLeft(scrollLeft > 4);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    }, []);

    useEffect(() => {
        updateScrollHints();
        window.addEventListener('resize', updateScrollHints);

        return () => window.removeEventListener('resize', updateScrollHints);
    }, [rows.length, columns.length, updateScrollHints]);

    const scrollBy = (direction: 'left' | 'right') => {
        scrollRef.current?.scrollBy({
            left: direction === 'left' ? -160 : 160,
            behavior: 'smooth',
        });
    };

    return (
        <div className="relative pb-4 md:hidden">
            {canScrollLeft && (
                <div
                    className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-8 bg-linear-to-r from-white via-white/80 to-transparent"
                    aria-hidden
                />
            )}
            {canScrollRight && (
                <div
                    className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-8 bg-linear-to-l from-white via-white/80 to-transparent"
                    aria-hidden
                />
            )}

            {(canScrollLeft || canScrollRight) && (
                <div className="absolute top-2 right-2 z-20 flex gap-1">
                    <button
                        type="button"
                        onClick={() => scrollBy('left')}
                        disabled={!canScrollLeft}
                        className="cursor-pointer rounded-md border border-violet-200/80 bg-white/95 p-1 text-[#7c3aed] shadow-sm disabled:opacity-30"
                        aria-label="Desplazar columnas a la izquierda"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollBy('right')}
                        disabled={!canScrollRight}
                        className="cursor-pointer rounded-md border border-violet-200/80 bg-white/95 p-1 text-[#7c3aed] shadow-sm disabled:opacity-30"
                        aria-label="Desplazar columnas a la derecha"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            )}

            <p className="px-3 pt-2 pb-1 text-[11px] text-[#9d8fb0]">
                Desliza → para ver más columnas
            </p>

            <div
                ref={scrollRef}
                onScroll={updateScrollHints}
                className="overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-200"
            >
                <table className="min-w-full border-collapse text-left text-sm">
                    <thead>
                        <tr className="border-b border-violet-100/80 bg-violet-50/60 text-[11px] font-bold tracking-wide text-[#7c3aed] uppercase">
                            {columns.map((col, index) => (
                                <th
                                    key={col.id}
                                    className={cn(
                                        'px-3 py-2.5 whitespace-nowrap',
                                        col.id === primaryColumnId &&
                                            'sticky left-0 z-20 bg-violet-50/95 shadow-[2px_0_6px_-2px_rgba(124,58,237,0.15)]',
                                        index === 0 &&
                                            col.id !== primaryColumnId &&
                                            'pl-3',
                                        col.headerClassName,
                                    )}
                                >
                                    {col.sortable && col.sortValue ? (
                                        <DataTableSortHeader
                                            label={col.header}
                                            columnId={col.id}
                                            sort={sort}
                                            onSort={onSort}
                                            className="text-[11px]"
                                        />
                                    ) : (
                                        col.header
                                    )}
                                </th>
                            ))}
                            {renderActions && (
                                <th className="sticky right-0 z-20 bg-violet-50/95 px-3 py-2.5 text-right whitespace-nowrap shadow-[-2px_0_6px_-2px_rgba(124,58,237,0.15)]">
                                    {actionsHeader}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr
                                key={getRowKey(row)}
                                className="border-b border-violet-50/80 last:border-0"
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.id}
                                        className={cn(
                                            'px-3 py-2.5 whitespace-nowrap',
                                            col.id === primaryColumnId &&
                                                'sticky left-0 z-10 bg-white shadow-[2px_0_6px_-2px_rgba(124,58,237,0.08)]',
                                            col.cellClassName,
                                        )}
                                    >
                                        {col.cell(row)}
                                    </td>
                                ))}
                                {renderActions && (
                                    <td className="sticky right-0 z-10 bg-white px-2 py-2 shadow-[-2px_0_6px_-2px_rgba(124,58,237,0.08)]">
                                        <div className="flex justify-end gap-0.5">
                                            {renderActions(row)}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
