import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as paymentMethodsIndex } from '@/routes/admin/tesoreria/metodos-pago';
import type {
    PaymentMethodFormValues,
    PaymentMethodRow,
    PaymentMethodsIndexPageProps,
} from '@/types/admin/treasury';

export type PaymentMethodsModalFlash = Pick<
    PaymentMethodsIndexPageProps,
    'paymentMethodModal' | 'paymentMethodModalId'
>;

type FormState = {
    open: boolean;
    mode: 'create' | 'edit';
    method: PaymentMethodFormValues | null;
};

function buildInitialFormState(
    paymentMethodModal: PaymentMethodsIndexPageProps['paymentMethodModal'],
    paymentMethodModalId: PaymentMethodsIndexPageProps['paymentMethodModalId'],
    methods: PaymentMethodRow[],
): FormState {
    if (paymentMethodModal === 'create') {
        return { open: true, mode: 'create', method: null };
    }

    if (paymentMethodModal === 'edit' && paymentMethodModalId) {
        const method = methods.find((row) => row.id === paymentMethodModalId);

        if (method) {
            return {
                open: true,
                mode: 'edit',
                method: {
                    id: method.id,
                    name: method.name,
                    type: method.type,
                    is_active: method.is_active,
                },
            };
        }
    }

    return { open: false, mode: 'create', method: null };
}

const paymentMethodsIndexResetUrl = paymentMethodsIndex.url({
    query: { _reset: 1 },
});

export function usePaymentMethodsModals(
    methods: PaymentMethodRow[],
    flash: PaymentMethodsModalFlash,
) {
    const initial = buildInitialFormState(
        flash.paymentMethodModal,
        flash.paymentMethodModalId,
        methods,
    );

    const [formOpen, setFormOpen] = useState(initial.open);
    const [formMode, setFormMode] = useState(initial.mode);
    const [editingMethod, setEditingMethod] = useState(initial.method);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingMethod, setDeletingMethod] = useState<PaymentMethodRow | null>(
        null,
    );

    const closeFormModal = useCallback(() => {
        setFormOpen(false);
        setFormMode('create');
        setEditingMethod(null);

        router.visit(paymentMethodsIndexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const openCreate = useCallback(() => {
        setFormMode('create');
        setEditingMethod(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((method: PaymentMethodRow) => {
        setFormMode('edit');
        setEditingMethod({
            id: method.id,
            name: method.name,
            type: method.type,
            is_active: method.is_active,
        });
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((method: PaymentMethodRow) => {
        setDeletingMethod(method);
        setDeleteOpen(true);
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingMethod(null);
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
        editingMethod,
        deleteOpen,
        deletingMethod,
        openCreate,
        openEdit,
        openDelete,
        closeFormModal,
        handleFormOpenChange,
        handleDeleteOpenChange,
    };
}
