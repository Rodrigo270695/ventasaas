import { useMemo } from 'react';
import type { DataTableColumn } from '@/components/data-table/types';

export type SortDirection = 'asc' | 'desc';

export type SortState = {
    columnId: string;
    direction: SortDirection;
} | null;

type Options<T> = {
    items: T[];
    sort: SortState;
    columns: DataTableColumn<T>[];
};

function compareValues(
    a: string | number,
    b: string | number,
    direction: SortDirection,
): number {
    if (typeof a === 'number' && typeof b === 'number') {
        return direction === 'asc' ? a - b : b - a;
    }

    const result = String(a).localeCompare(String(b), undefined, {
        sensitivity: 'base',
        numeric: true,
    });

    return direction === 'asc' ? result : -result;
}

export function useSortedList<T>({ items, sort, columns }: Options<T>) {
    return useMemo(() => {
        if (!sort) {
            return items;
        }

        const column = columns.find((col) => col.id === sort.columnId);

        if (!column?.sortValue) {
            return items;
        }

        const getValue = column.sortValue;

        return [...items].sort((rowA, rowB) =>
            compareValues(
                getValue(rowA),
                getValue(rowB),
                sort.direction,
            ),
        );
    }, [items, sort, columns]);
}

export function toggleSort(
    current: SortState,
    columnId: string,
): SortState {
    if (current?.columnId !== columnId) {
        return { columnId, direction: 'asc' };
    }

    return {
        columnId,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
    };
}
