import type { CategoryRow } from '@/types/admin/categories';

export type CategoryTreeRow = CategoryRow & {
    depth: number;
};

const ROOT_KEY = '__root__';

function parentKey(parentId: string | null): string {
    return parentId ?? ROOT_KEY;
}

function sortByName(a: CategoryRow, b: CategoryRow): number {
    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
}

/**
 * Ordena categorías en profundidad: padre y luego sus hijos (recursivo).
 */
export function orderCategoriesHierarchically(
    categories: CategoryRow[],
): CategoryTreeRow[] {
    const byId = new Map(categories.map((row) => [row.id, row]));
    const byParent = new Map<string, CategoryRow[]>();

    for (const category of categories) {
        const key = parentKey(category.parent_id);
        const list = byParent.get(key) ?? [];
        list.push(category);
        byParent.set(key, list);
    }

    for (const list of byParent.values()) {
        list.sort(sortByName);
    }

    const result: CategoryTreeRow[] = [];
    const visited = new Set<string>();

    const walk = (parentId: string | null, depth: number) => {
        const siblings = byParent.get(parentKey(parentId)) ?? [];

        for (const category of siblings) {
            if (visited.has(category.id)) {
                continue;
            }

            visited.add(category.id);
            result.push({ ...category, depth });
            walk(category.id, depth + 1);
        }
    };

    walk(null, 0);

    // Huérfanas: parent_id apunta a un registro inexistente
    for (const category of categories) {
        if (visited.has(category.id)) {
            continue;
        }

        if (category.parent_id && !byId.has(category.parent_id)) {
            result.push({ ...category, depth: 0 });
            visited.add(category.id);
        }
    }

    return result;
}
