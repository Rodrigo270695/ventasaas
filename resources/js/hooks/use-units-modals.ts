import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as unitsIndex } from '@/routes/admin/catalogo/unidades';
import type {
    UnitFormValues,
    UnitRow,
    UnitsIndexPageProps,
} from '@/types/admin/units';

export type UnitsModalFlash = Pick<
    UnitsIndexPageProps,
    'unitModal' | 'unitModalUnitId'
>;

type FormState = {
    open: boolean;
    mode: 'create' | 'edit';
    unit: UnitFormValues | null;
};

function buildInitialFormState(
    unitModal: UnitsIndexPageProps['unitModal'],
    unitModalUnitId: UnitsIndexPageProps['unitModalUnitId'],
    units: UnitRow[],
): FormState {
    if (unitModal === 'create') {
        return { open: true, mode: 'create', unit: null };
    }

    if (unitModal === 'edit' && unitModalUnitId) {
        const unit = units.find((row) => row.id === unitModalUnitId);

        if (unit) {
            return {
                open: true,
                mode: 'edit',
                unit: {
                    id: unit.id,
                    code: unit.code,
                    name: unit.name,
                    sunat_code: unit.sunat_code ?? '',
                    symbol: unit.symbol ?? '',
                    allows_decimals: unit.allows_decimals,
                    is_active: unit.is_active,
                },
            };
        }
    }

    return { open: false, mode: 'create', unit: null };
}

const unitsIndexResetUrl = unitsIndex.url({
    query: { _reset: 1 },
});

export function useUnitsModals(units: UnitRow[], flash: UnitsModalFlash) {
    const initial = buildInitialFormState(
        flash.unitModal,
        flash.unitModalUnitId,
        units,
    );

    const [formOpen, setFormOpen] = useState(initial.open);
    const [formMode, setFormMode] = useState(initial.mode);
    const [editingUnit, setEditingUnit] = useState(initial.unit);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingUnit, setDeletingUnit] = useState<UnitRow | null>(null);

    const closeFormModal = useCallback(() => {
        setFormOpen(false);
        setFormMode('create');
        setEditingUnit(null);

        router.visit(unitsIndexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const openCreate = useCallback(() => {
        setFormMode('create');
        setEditingUnit(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((unit: UnitRow) => {
        setFormMode('edit');
        setEditingUnit({
            id: unit.id,
            code: unit.code,
            name: unit.name,
            sunat_code: unit.sunat_code ?? '',
            symbol: unit.symbol ?? '',
            allows_decimals: unit.allows_decimals,
            is_active: unit.is_active,
        });
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((unit: UnitRow) => {
        setDeletingUnit(unit);
        setDeleteOpen(true);
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingUnit(null);
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
        editingUnit,
        deleteOpen,
        deletingUnit,
        openCreate,
        openEdit,
        openDelete,
        closeFormModal,
        handleFormOpenChange,
        handleDeleteOpenChange,
    };
}
