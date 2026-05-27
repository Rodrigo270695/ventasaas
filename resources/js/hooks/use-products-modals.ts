import { router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { index as productsIndex } from '@/routes/admin/catalogo/productos';
import type { ProductRow, ProductsIndexPageProps } from '@/types/admin/products';

export type ProductsModalFlash = Pick<
    ProductsIndexPageProps,
    'productModal'
>;

const productsIndexResetUrl = productsIndex.url({
    query: { _reset: 1 },
});

export function useProductsModals(flash: ProductsModalFlash) {
    const [formOpen, setFormOpen] = useState(flash.productModal === 'create');

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingProduct, setDeletingProduct] = useState<ProductRow | null>(
        null,
    );

    useEffect(() => {
        if (flash.productModal === 'create') {
            setFormOpen(true);
        }
    }, [flash.productModal]);

    const closeFormModal = useCallback(() => {
        setFormOpen(false);

        router.visit(productsIndexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const openCreate = useCallback(() => {
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((product: ProductRow) => {
        setDeletingProduct(product);
        setDeleteOpen(true);
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingProduct(null);
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
        deleteOpen,
        deletingProduct,
        openCreate,
        openDelete,
        handleFormOpenChange,
        handleDeleteOpenChange,
    };
}
