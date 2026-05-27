import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as cashRegistersIndex } from '@/routes/admin/tesoreria/cajas';
import type {
    CashRegisterFormValues,
    CashRegisterRow,
    CashRegistersIndexPageProps,
} from '@/types/admin/treasury';

export type CashRegistersModalFlash = Pick<
    CashRegistersIndexPageProps,
    'cashRegisterModal' | 'cashRegisterModalId'
>;

type FormState = {
    open: boolean;
    mode: 'create' | 'edit';
    register: CashRegisterFormValues | null;
};

function buildInitialFormState(
    cashRegisterModal: CashRegistersIndexPageProps['cashRegisterModal'],
    cashRegisterModalId: CashRegistersIndexPageProps['cashRegisterModalId'],
    registers: CashRegisterRow[],
): FormState {
    if (cashRegisterModal === 'create') {
        return { open: true, mode: 'create', register: null };
    }

    if (cashRegisterModal === 'edit' && cashRegisterModalId) {
        const register = registers.find((row) => row.id === cashRegisterModalId);

        if (register) {
            return {
                open: true,
                mode: 'edit',
                register: {
                    id: register.id,
                    name: register.name,
                    warehouse_id: register.warehouse_id ?? '',
                    is_active: register.is_active,
                },
            };
        }
    }

    return { open: false, mode: 'create', register: null };
}

const cashRegistersIndexResetUrl = cashRegistersIndex.url({
    query: { _reset: 1 },
});

export function useCashRegistersModals(
    registers: CashRegisterRow[],
    flash: CashRegistersModalFlash,
) {
    const initial = buildInitialFormState(
        flash.cashRegisterModal,
        flash.cashRegisterModalId,
        registers,
    );

    const [formOpen, setFormOpen] = useState(initial.open);
    const [formMode, setFormMode] = useState(initial.mode);
    const [editingRegister, setEditingRegister] = useState(initial.register);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingRegister, setDeletingRegister] =
        useState<CashRegisterRow | null>(null);

    const closeFormModal = useCallback(() => {
        setFormOpen(false);
        setFormMode('create');
        setEditingRegister(null);

        router.visit(cashRegistersIndexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const openCreate = useCallback(() => {
        setFormMode('create');
        setEditingRegister(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((register: CashRegisterRow) => {
        setFormMode('edit');
        setEditingRegister({
            id: register.id,
            name: register.name,
            warehouse_id: register.warehouse_id ?? '',
            is_active: register.is_active,
        });
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((register: CashRegisterRow) => {
        setDeletingRegister(register);
        setDeleteOpen(true);
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingRegister(null);
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
        editingRegister,
        deleteOpen,
        deletingRegister,
        openCreate,
        openEdit,
        openDelete,
        handleFormOpenChange,
        handleDeleteOpenChange,
    };
}
