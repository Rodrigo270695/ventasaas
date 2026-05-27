import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as warehousesIndex } from '@/routes/admin/inventario/almacenes';
import type {
    WarehouseFormValues,
    WarehouseRow,
    WarehousesIndexPageProps,
} from '@/types/admin/warehouses';

export type WarehousesModalFlash = Pick<
    WarehousesIndexPageProps,
    'warehouseModal' | 'warehouseModalId'
>;

type FormState = {
    open: boolean;
    mode: 'create' | 'edit';
    warehouse: WarehouseFormValues | null;
};

function buildInitialFormState(
    warehouseModal: WarehousesIndexPageProps['warehouseModal'],
    warehouseModalId: WarehousesIndexPageProps['warehouseModalId'],
    warehouses: WarehouseRow[],
): FormState {
    if (warehouseModal === 'create') {
        return { open: true, mode: 'create', warehouse: null };
    }

    if (warehouseModal === 'edit' && warehouseModalId) {
        const warehouse = warehouses.find((row) => row.id === warehouseModalId);

        if (warehouse) {
            return {
                open: true,
                mode: 'edit',
                warehouse: { ...warehouse },
            };
        }
    }

    return { open: false, mode: 'create', warehouse: null };
}

const warehousesIndexResetUrl = warehousesIndex.url({
    query: { _reset: 1 },
});

export function useWarehousesModals(
    warehouses: WarehouseRow[],
    flash: WarehousesModalFlash,
) {
    const initial = buildInitialFormState(
        flash.warehouseModal,
        flash.warehouseModalId,
        warehouses,
    );

    const [formOpen, setFormOpen] = useState(initial.open);
    const [formMode, setFormMode] = useState(initial.mode);
    const [editingWarehouse, setEditingWarehouse] = useState(initial.warehouse);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingWarehouse, setDeletingWarehouse] = useState<WarehouseRow | null>(
        null,
    );

    const closeFormModal = useCallback(() => {
        setFormOpen(false);
        setFormMode('create');
        setEditingWarehouse(null);

        router.visit(warehousesIndexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const openCreate = useCallback(() => {
        setFormMode('create');
        setEditingWarehouse(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((warehouse: WarehouseRow) => {
        setFormMode('edit');
        setEditingWarehouse({ ...warehouse });
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((warehouse: WarehouseRow) => {
        setDeletingWarehouse(warehouse);
        setDeleteOpen(true);
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingWarehouse(null);
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
        editingWarehouse,
        deleteOpen,
        deletingWarehouse,
        openCreate,
        openEdit,
        openDelete,
        handleFormOpenChange,
        handleDeleteOpenChange,
    };
}
