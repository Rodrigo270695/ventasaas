import { useDeferredValue, useMemo } from 'react';

/**
 * Normaliza texto para búsqueda insensible a mayúsculas y acentos.
 */
export function normalizeSearchText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '');
}

type Options<T> = {
    items: T[];
    query: string;
    getSearchText: (item: T) => string;
};

/**
 * Filtra listas grandes con buen rendimiento: índice precalculado + query diferida.
 */
export function useFilteredList<T>({
    items,
    query,
    getSearchText,
}: Options<T>) {
    const deferredQuery = useDeferredValue(query);
    const isPending = query !== deferredQuery;

    const searchIndex = useMemo(
        () => items.map((item) => normalizeSearchText(getSearchText(item))),
        [items, getSearchText],
    );

    const normalizedQuery = useMemo(() => {
        const trimmed = deferredQuery.trim();

        return trimmed ? normalizeSearchText(trimmed) : '';
    }, [deferredQuery]);

    const filteredItems = useMemo(() => {
        if (!normalizedQuery) {
            return items;
        }

        return items.filter((_, index) =>
            searchIndex[index].includes(normalizedQuery),
        );
    }, [items, searchIndex, normalizedQuery]);

    return {
        filteredItems,
        isPending,
        hasActiveFilter: normalizedQuery.length > 0,
    };
}
