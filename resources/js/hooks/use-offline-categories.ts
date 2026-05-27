import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormSelectOption } from '@/components/form';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import {
    buildCategoriesStats,
    CATEGORIES_RESOURCE,
    createCategoryOffline,
    deleteCategoryOffline,
    loadCategoriesSnapshot,
    persistCategoriesSnapshot,
    updateCategoryOffline,
    type CategoryFormPayload,
} from '@/lib/offline-categories';
import { countPendingActions } from '@/lib/offline-store';
import type { CategoryRow, CategoryStatItem } from '@/types/admin/categories';

type Args = {
    serverCategories: CategoryRow[];
    serverParentOptions: FormSelectOption[];
    serverStats: CategoryStatItem[];
};

export function useOfflineCategories({
    serverCategories,
    serverParentOptions,
    serverStats,
}: Args) {
    const { isOffline } = useOfflineStatus();
    const [categories, setCategories] = useState<CategoryRow[]>(serverCategories);
    const [parentOptions, setParentOptions] =
        useState<FormSelectOption[]>(serverParentOptions);
    const [pendingCount, setPendingCount] = useState(() =>
        countPendingActions(CATEGORIES_RESOURCE),
    );

    useEffect(() => {
        if (isOffline) {
            const snapshot = loadCategoriesSnapshot();

            if (snapshot) {
                setCategories(snapshot.categories);
                setParentOptions(snapshot.parentOptions);
            }

            return;
        }

        setCategories(serverCategories);
        setParentOptions(serverParentOptions);
        persistCategoriesSnapshot(serverCategories, serverParentOptions);
    }, [isOffline, serverCategories, serverParentOptions]);

    useEffect(() => {
        setPendingCount(countPendingActions(CATEGORIES_RESOURCE));
    }, [categories]);

    const stats = useMemo(() => {
        if (!isOffline) {
            return serverStats;
        }

        return buildCategoriesStats(categories);
    }, [categories, isOffline, serverStats]);

    const refreshPendingCount = useCallback(() => {
        setPendingCount(countPendingActions(CATEGORIES_RESOURCE));
    }, []);

    const createOffline = useCallback(
        (payload: CategoryFormPayload) => {
            setCategories((current) => {
                const next = createCategoryOffline(current, payload);
                setParentOptions(
                    next.map((row) => ({ value: row.id, label: row.name })),
                );

                return next;
            });
            refreshPendingCount();
        },
        [refreshPendingCount],
    );

    const updateOffline = useCallback(
        (categoryId: string, payload: CategoryFormPayload) => {
            setCategories((current) => {
                const next = updateCategoryOffline(current, categoryId, payload);
                setParentOptions(
                    next.map((row) => ({ value: row.id, label: row.name })),
                );

                return next;
            });
            refreshPendingCount();
        },
        [refreshPendingCount],
    );

    const deleteOffline = useCallback(
        (categoryId: string) => {
            setCategories((current) => {
                const next = deleteCategoryOffline(current, categoryId);
                setParentOptions(
                    next.map((row) => ({ value: row.id, label: row.name })),
                );

                return next;
            });
            refreshPendingCount();
        },
        [refreshPendingCount],
    );

    return {
        categories,
        parentOptions,
        stats,
        isOffline,
        pendingCount,
        createOffline,
        updateOffline,
        deleteOffline,
    };
}
