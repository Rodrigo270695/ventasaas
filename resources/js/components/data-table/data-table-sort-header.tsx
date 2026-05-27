import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
} from 'lucide-react';
import type { SortDirection, SortState } from '@/hooks/use-sorted-list';
import { cn } from '@/lib/utils';

type Props = {
    label: string;
    columnId: string;
    sort: SortState;
    onSort: (columnId: string) => void;
    align?: 'left' | 'right';
    className?: string;
};

export function DataTableSortHeader({
    label,
    columnId,
    sort,
    onSort,
    align = 'left',
    className,
}: Props) {
    const isActive = sort?.columnId === columnId;
    const direction: SortDirection | null = isActive ? sort.direction : null;

    const SortIcon =
        direction === 'asc'
            ? ArrowUp
            : direction === 'desc'
              ? ArrowDown
              : ArrowUpDown;

    return (
        <button
            type="button"
            onClick={() => onSort(columnId)}
            className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-md transition-colors hover:text-[#5b21b6]',
                align === 'right' && 'ml-auto',
                isActive && 'text-[#5b21b6]',
                className,
            )}
            aria-label={`Ordenar por ${label} ${
                direction === 'asc'
                    ? 'ascendente'
                    : direction === 'desc'
                      ? 'descendente'
                      : ''
            }`}
        >
            <span>{label}</span>
            <SortIcon
                className={cn(
                    'size-3.5 shrink-0',
                    !isActive && 'opacity-50',
                )}
                aria-hidden
            />
        </button>
    );
}
