import { useEffect, useMemo, useState } from 'react';

export const PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 50, 100] as const;

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE: PageSizeOption = 15;

type Options = {
    initialPageSize?: PageSizeOption;
};

export function usePagination<T>(items: T[], options: Options = {}) {
    const { initialPageSize = DEFAULT_PAGE_SIZE } = options;
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSizeOption>(initialPageSize);

    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    useEffect(() => {
        setPage(1);
    }, [items.length, pageSize]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const paginatedItems = useMemo(() => {
        const start = (page - 1) * pageSize;

        return items.slice(start, start + pageSize);
    }, [items, page, pageSize]);

    const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, totalItems);

    const setPageSizeAndReset = (size: PageSizeOption) => {
        setPageSize(size);
        setPage(1);
    };

    return {
        paginatedItems,
        page,
        setPage,
        pageSize,
        setPageSize: setPageSizeAndReset,
        totalItems,
        totalPages,
        rangeStart,
        rangeEnd,
    };
}

export function getPaginationPages(
    current: number,
    total: number,
): (number | 'ellipsis')[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, index) => index + 1);
    }

    const pages: (number | 'ellipsis')[] = [1];

    if (current > 3) {
        pages.push('ellipsis');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }

    if (current < total - 2) {
        pages.push('ellipsis');
    }

    pages.push(total);

    return pages;
}
