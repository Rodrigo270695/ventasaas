import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { DataTableColumn } from '@/components/data-table/types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { SortDirection, SortState } from '@/hooks/use-sorted-list';
import { cn } from '@/lib/utils';

type Props<T> = {
    sortableColumns: DataTableColumn<T>[];
    sort: SortState;
    onSortColumnChange: (columnId: string) => void;
    onSortDirectionToggle: () => void;
    resultCount: number;
    className?: string;
};

export function DataTableMobileToolbar<T>({
    sortableColumns,
    sort,
    onSortColumnChange,
    onSortDirectionToggle,
    resultCount,
    className,
}: Props<T>) {
    const direction: SortDirection | null = sort?.direction ?? null;

    return (
        <div
            className={cn(
                'sticky top-0 z-10 flex flex-col gap-2 border-b border-violet-100/80 bg-white/95 px-3 py-2.5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between md:hidden',
                className,
            )}
        >
            <p className="shrink-0 text-xs font-semibold text-[#7c6f8a]">
                <span className="text-[#4c1d95]">{resultCount}</span>{' '}
                {resultCount === 1 ? 'registro' : 'registros'}
            </p>

            {sortableColumns.length > 0 && (
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs sm:flex-initial">
                    <Select
                        value={sort?.columnId}
                        onValueChange={onSortColumnChange}
                    >
                        <SelectTrigger
                            size="sm"
                            className={cn(
                                'h-9 w-full min-w-0 flex-1 cursor-pointer rounded-xl border-violet-200/90 bg-white px-3 text-xs font-semibold text-[#5b21b6] shadow-sm',
                                'hover:bg-violet-50/50',
                                'focus-visible:border-[#ec4899] focus-visible:ring-2 focus-visible:ring-[#ec4899]/20',
                                '[&_svg]:text-[#9d8fb0]',
                            )}
                            aria-label="Ordenar por"
                        >
                            <SelectValue placeholder="Ordenar por…" />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            side="top"
                            align="start"
                            sideOffset={8}
                            collisionPadding={16}
                            className={cn(
                                'z-200 rounded-xl border-violet-200/90 bg-white p-1 shadow-lg shadow-violet-200/40',
                            )}
                        >
                            {sortableColumns.map((col) => (
                                <SelectItem
                                    key={col.id}
                                    value={col.id}
                                    className={cn(
                                        'cursor-pointer rounded-lg py-2 pr-8 pl-2.5 text-sm font-medium text-[#4c1d95]',
                                        'focus:bg-violet-50 focus:text-[#5b21b6]',
                                        'data-[state=checked]:bg-violet-50 data-[state=checked]:text-[#6d28d9]',
                                    )}
                                >
                                    {col.header}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <button
                        type="button"
                        onClick={onSortDirectionToggle}
                        disabled={!sort}
                        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-violet-200/90 bg-white text-[#7c3aed] shadow-sm transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={
                            direction === 'asc'
                                ? 'Orden ascendente, cambiar a descendente'
                                : direction === 'desc'
                                  ? 'Orden descendente, cambiar a ascendente'
                                  : 'Selecciona una columna para ordenar'
                        }
                    >
                        {direction === 'asc' ? (
                            <ArrowUp className="size-4" />
                        ) : direction === 'desc' ? (
                            <ArrowDown className="size-4" />
                        ) : (
                            <ArrowUpDown className="size-4 opacity-50" />
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
