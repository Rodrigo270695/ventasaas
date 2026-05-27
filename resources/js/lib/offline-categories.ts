import type { FormSelectOption } from '@/components/form';
import {
    cacheCollectionSnapshot,
    enqueuePendingAction,
    generateOfflineId,
    getCollectionSnapshot,
    isOfflineEntityId,
    removePendingActionsByLocalEntity,
    updateCollectionSnapshot,
    updatePendingCreatePayload,
} from '@/lib/offline-store';
import { destroy, store, update } from '@/routes/admin/catalogo/categorias';
import type { CategoryRow } from '@/types/admin/categories';

export const CATEGORIES_CACHE_KEY = 'catalogo.categorias';
export const CATEGORIES_RESOURCE = 'categories';

export type CategoryFormPayload = {
    parent_id: string;
    code: string;
    name: string;
    is_active: boolean;
};

function resolveParentName(
    parentId: string,
    categories: CategoryRow[],
): string | null {
    if (!parentId) {
        return null;
    }

    return categories.find((row) => row.id === parentId)?.name ?? null;
}

function buildParentOptions(categories: CategoryRow[]): FormSelectOption[] {
    return categories.map((row) => ({
        value: row.id,
        label: row.name,
    }));
}

function recalcStats(categories: CategoryRow[]) {
    const activeCount = categories.filter((row) => row.is_active).length;
    const withParent = categories.filter((row) => row.parent_id).length;

    return [
        {
            key: 'total' as const,
            label: 'Total',
            value: categories.length,
            tone: 'violet' as const,
        },
        {
            key: 'active' as const,
            label: 'Activas',
            value: activeCount,
            tone: 'green' as const,
        },
        {
            key: 'inactive' as const,
            label: 'Inactivas',
            value: categories.length - activeCount,
            tone: 'amber' as const,
        },
        {
            key: 'with_parent' as const,
            label: 'Subcategorías',
            value: withParent,
            tone: 'cyan' as const,
        },
    ];
}

export function persistCategoriesSnapshot(
    categories: CategoryRow[],
    parentOptions: FormSelectOption[],
): void {
    cacheCollectionSnapshot(CATEGORIES_CACHE_KEY, categories, {
        parentOptions,
    });
}

export function loadCategoriesSnapshot(): {
    categories: CategoryRow[];
    parentOptions: FormSelectOption[];
} | null {
    const snapshot = getCollectionSnapshot<CategoryRow>(CATEGORIES_CACHE_KEY);

    if (!snapshot) {
        return null;
    }

    const parentOptions = Array.isArray(snapshot.meta.parentOptions)
        ? (snapshot.meta.parentOptions as FormSelectOption[])
        : buildParentOptions(snapshot.items);

    return {
        categories: snapshot.items,
        parentOptions,
    };
}

export function createCategoryOffline(
    categories: CategoryRow[],
    payload: CategoryFormPayload,
): CategoryRow[] {
    const localId = generateOfflineId();
    const parentId = payload.parent_id || null;

    const nextRow: CategoryRow = {
        id: localId,
        parent_id: parentId,
        parent_name: resolveParentName(payload.parent_id, categories),
        code: payload.code.trim(),
        name: payload.name.trim(),
        is_active: payload.is_active,
        children_count: 0,
    };

    const next = [...categories, nextRow];

    enqueuePendingAction({
        resource: CATEGORIES_RESOURCE,
        method: 'POST',
        endpoint: store.url(),
        localEntityId: localId,
        payload: {
            parent_id: payload.parent_id || '',
            code: payload.code.trim(),
            name: payload.name.trim(),
            is_active: payload.is_active,
        },
    });

    persistCategoriesSnapshot(next, buildParentOptions(next));

    return next;
}

export function updateCategoryOffline(
    categories: CategoryRow[],
    categoryId: string,
    payload: CategoryFormPayload,
): CategoryRow[] {
    const parentId = payload.parent_id || null;

    const next = categories.map((row) => {
        if (row.id !== categoryId) {
            return row;
        }

        return {
            ...row,
            parent_id: parentId,
            parent_name: resolveParentName(payload.parent_id, categories),
            code: payload.code.trim(),
            name: payload.name.trim(),
            is_active: payload.is_active,
        };
    });

    const body = {
        parent_id: payload.parent_id || '',
        code: payload.code.trim(),
        name: payload.name.trim(),
        is_active: payload.is_active,
    };

    if (isOfflineEntityId(categoryId)) {
        updatePendingCreatePayload(categoryId, body);
    } else {
        enqueuePendingAction({
            resource: CATEGORIES_RESOURCE,
            method: 'PUT',
            endpoint: update.url(categoryId),
            payload: body,
        });
    }

    persistCategoriesSnapshot(next, buildParentOptions(next));

    return next;
}

export function deleteCategoryOffline(
    categories: CategoryRow[],
    categoryId: string,
): CategoryRow[] {
    const next = categories.filter((row) => row.id !== categoryId);

    if (isOfflineEntityId(categoryId)) {
        removePendingActionsByLocalEntity(categoryId);
    } else {
        enqueuePendingAction({
            resource: CATEGORIES_RESOURCE,
            method: 'DELETE',
            endpoint: destroy.url(categoryId),
            payload: {},
        });
    }

    persistCategoriesSnapshot(next, buildParentOptions(next));

    return next;
}

export function buildCategoriesStats(categories: CategoryRow[]) {
    return recalcStats(categories);
}

export function replaceCategoriesCache(categories: CategoryRow[]): void {
    updateCollectionSnapshot(CATEGORIES_CACHE_KEY, categories);
}
