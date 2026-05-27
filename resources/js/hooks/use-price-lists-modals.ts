import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as priceListsIndex } from '@/routes/admin/catalogo/listas-precios';
import type {
    PriceListFormValues,
    PriceListRow,
    PriceListsIndexPageProps,
} from '@/types/admin/price-lists';

export type PriceListsModalFlash = Pick<
    PriceListsIndexPageProps,
    'priceListModal' | 'priceListModalId'
>;

type FormState = {
    open: boolean;
    mode: 'create' | 'edit';
    priceList: PriceListFormValues | null;
};

function buildInitialFormState(
    priceListModal: PriceListsIndexPageProps['priceListModal'],
    priceListModalId: PriceListsIndexPageProps['priceListModalId'],
    priceLists: PriceListRow[],
): FormState {
    if (priceListModal === 'create') {
        return { open: true, mode: 'create', priceList: null };
    }

    if (priceListModal === 'edit' && priceListModalId) {
        const priceList = priceLists.find((row) => row.id === priceListModalId);

        if (priceList) {
            return {
                open: true,
                mode: 'edit',
                priceList: {
                    id: priceList.id,
                    code: priceList.code,
                    name: priceList.name,
                    currency_code: priceList.currency_code,
                    is_default: priceList.is_default,
                    is_active: priceList.is_active,
                    sort_order: priceList.sort_order,
                },
            };
        }
    }

    return { open: false, mode: 'create', priceList: null };
}

const priceListsIndexResetUrl = priceListsIndex.url({
    query: { _reset: 1 },
});

export function usePriceListsModals(
    priceLists: PriceListRow[],
    flash: PriceListsModalFlash,
) {
    const initial = buildInitialFormState(
        flash.priceListModal,
        flash.priceListModalId,
        priceLists,
    );

    const [formOpen, setFormOpen] = useState(initial.open);
    const [formMode, setFormMode] = useState(initial.mode);
    const [editingPriceList, setEditingPriceList] = useState(initial.priceList);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingPriceList, setDeletingPriceList] =
        useState<PriceListRow | null>(null);

    const closeFormModal = useCallback(() => {
        setFormOpen(false);
        setFormMode('create');
        setEditingPriceList(null);

        router.visit(priceListsIndexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const openCreate = useCallback(() => {
        setFormMode('create');
        setEditingPriceList(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((priceList: PriceListRow) => {
        setFormMode('edit');
        setEditingPriceList({
            id: priceList.id,
            code: priceList.code,
            name: priceList.name,
            currency_code: priceList.currency_code,
            is_default: priceList.is_default,
            is_active: priceList.is_active,
            sort_order: priceList.sort_order,
        });
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((priceList: PriceListRow) => {
        setDeletingPriceList(priceList);
        setDeleteOpen(true);
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingPriceList(null);
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
        editingPriceList,
        deleteOpen,
        deletingPriceList,
        openCreate,
        openEdit,
        openDelete,
        handleFormOpenChange,
        handleDeleteOpenChange,
    };
}
