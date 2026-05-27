import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as categoriesIndex } from '@/routes/admin/catalogo/categorias';
import type {
    CategoriesIndexPageProps,
    CategoryFormValues,
    CategoryRow,
} from '@/types/admin/categories';

export type CategoriesModalFlash = Pick<
    CategoriesIndexPageProps,
    'categoryModal' | 'categoryModalCategoryId'
> & {
    isOffline?: boolean;
};

type FormState = {
    open: boolean;
    mode: 'create' | 'edit';
    category: CategoryFormValues | null;
};

function buildInitialFormState(
    categoryModal: CategoriesIndexPageProps['categoryModal'],
    categoryModalCategoryId: CategoriesIndexPageProps['categoryModalCategoryId'],
    categories: CategoryRow[],
): FormState {
    if (categoryModal === 'create') {
        return { open: true, mode: 'create', category: null };
    }

    if (categoryModal === 'edit' && categoryModalCategoryId) {
        const category = categories.find((row) => row.id === categoryModalCategoryId);

        if (category) {
            return {
                open: true,
                mode: 'edit',
                category: {
                    id: category.id,
                    parent_id: category.parent_id ?? '',
                    code: category.code,
                    name: category.name,
                    is_active: category.is_active,
                },
            };
        }
    }

    return { open: false, mode: 'create', category: null };
}

const categoriesIndexResetUrl = categoriesIndex.url({
    query: { _reset: 1 },
});

export function useCategoriesModals(
    categories: CategoryRow[],
    flash: CategoriesModalFlash,
) {
    const initial = buildInitialFormState(
        flash.categoryModal,
        flash.categoryModalCategoryId,
        categories,
    );

    const [formOpen, setFormOpen] = useState(initial.open);
    const [formMode, setFormMode] = useState(initial.mode);
    const [editingCategory, setEditingCategory] = useState(initial.category);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<CategoryRow | null>(
        null,
    );

    const closeFormModal = useCallback(() => {
        setFormOpen(false);
        setFormMode('create');
        setEditingCategory(null);

        if (flash.isOffline) {
            return;
        }

        router.visit(categoriesIndexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, [flash.isOffline]);

    const openCreate = useCallback(() => {
        setFormMode('create');
        setEditingCategory(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((category: CategoryRow) => {
        setFormMode('edit');
        setEditingCategory({
            id: category.id,
            parent_id: category.parent_id ?? '',
            code: category.code,
            name: category.name,
            is_active: category.is_active,
        });
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((category: CategoryRow) => {
        setDeletingCategory(category);
        setDeleteOpen(true);
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingCategory(null);
        }
    }, []);

    const handleFormOpenChange = useCallback(
        (open: boolean) => {
            if (!open) {
                closeFormModal();

                return;
            }

            setFormOpen(true);
        },
        [closeFormModal],
    );

    return {
        formOpen,
        formMode,
        editingCategory,
        deleteOpen,
        deletingCategory,
        openCreate,
        openEdit,
        openDelete,
        handleFormOpenChange,
        handleDeleteOpenChange,
    };
}
