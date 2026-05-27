import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as brandsIndex } from '@/routes/admin/catalogo/marcas';
import type {
    BrandFormValues,
    BrandRow,
    BrandsIndexPageProps,
} from '@/types/admin/brands';

export type BrandsModalFlash = Pick<
    BrandsIndexPageProps,
    'brandModal' | 'brandModalBrandId'
>;

type FormState = {
    open: boolean;
    mode: 'create' | 'edit';
    brand: BrandFormValues | null;
};

function buildInitialFormState(
    brandModal: BrandsIndexPageProps['brandModal'],
    brandModalBrandId: BrandsIndexPageProps['brandModalBrandId'],
    brands: BrandRow[],
): FormState {
    if (brandModal === 'create') {
        return { open: true, mode: 'create', brand: null };
    }

    if (brandModal === 'edit' && brandModalBrandId) {
        const brand = brands.find((row) => row.id === brandModalBrandId);

        if (brand) {
            return {
                open: true,
                mode: 'edit',
                brand: {
                    id: brand.id,
                    code: brand.code,
                    name: brand.name,
                    is_active: brand.is_active,
                },
            };
        }
    }

    return { open: false, mode: 'create', brand: null };
}

const brandsIndexResetUrl = brandsIndex.url({
    query: { _reset: 1 },
});

export function useBrandsModals(brands: BrandRow[], flash: BrandsModalFlash) {
    const initial = buildInitialFormState(
        flash.brandModal,
        flash.brandModalBrandId,
        brands,
    );

    const [formOpen, setFormOpen] = useState(initial.open);
    const [formMode, setFormMode] = useState(initial.mode);
    const [editingBrand, setEditingBrand] = useState(initial.brand);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingBrand, setDeletingBrand] = useState<BrandRow | null>(null);

    const closeFormModal = useCallback(() => {
        setFormOpen(false);
        setFormMode('create');
        setEditingBrand(null);

        router.visit(brandsIndexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const openCreate = useCallback(() => {
        setFormMode('create');
        setEditingBrand(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((brand: BrandRow) => {
        setFormMode('edit');
        setEditingBrand({
            id: brand.id,
            code: brand.code,
            name: brand.name,
            is_active: brand.is_active,
        });
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((brand: BrandRow) => {
        setDeletingBrand(brand);
        setDeleteOpen(true);
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingBrand(null);
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
        editingBrand,
        deleteOpen,
        deletingBrand,
        openCreate,
        openEdit,
        openDelete,
        handleFormOpenChange,
        handleDeleteOpenChange,
    };
}
