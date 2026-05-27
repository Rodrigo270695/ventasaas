import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as taxProfilesIndex } from '@/routes/admin/catalogo/perfiles-tributarios';
import type {
    TaxProfileFormValues,
    TaxProfileRow,
    TaxProfilesIndexPageProps,
} from '@/types/admin/tax-profiles';

export type TaxProfilesModalFlash = Pick<
    TaxProfilesIndexPageProps,
    'taxProfileModal' | 'taxProfileModalId'
>;

type FormState = {
    open: boolean;
    mode: 'create' | 'edit';
    taxProfile: TaxProfileFormValues | null;
};

function buildInitialFormState(
    taxProfileModal: TaxProfilesIndexPageProps['taxProfileModal'],
    taxProfileModalId: TaxProfilesIndexPageProps['taxProfileModalId'],
    taxProfiles: TaxProfileRow[],
): FormState {
    if (taxProfileModal === 'create') {
        return { open: true, mode: 'create', taxProfile: null };
    }

    if (taxProfileModal === 'edit' && taxProfileModalId) {
        const taxProfile = taxProfiles.find((row) => row.id === taxProfileModalId);

        if (taxProfile) {
            return {
                open: true,
                mode: 'edit',
                taxProfile: {
                    id: taxProfile.id,
                    code: taxProfile.code,
                    name: taxProfile.name,
                    sunat_affectation_code: taxProfile.sunat_affectation_code,
                    igv_rate: taxProfile.igv_rate,
                    isc_rate: taxProfile.isc_rate,
                    is_default: taxProfile.is_default,
                    is_active: taxProfile.is_active,
                    sort_order: taxProfile.sort_order,
                },
            };
        }
    }

    return { open: false, mode: 'create', taxProfile: null };
}

const taxProfilesIndexResetUrl = taxProfilesIndex.url({
    query: { _reset: 1 },
});

export function useTaxProfilesModals(
    taxProfiles: TaxProfileRow[],
    flash: TaxProfilesModalFlash,
) {
    const initial = buildInitialFormState(
        flash.taxProfileModal,
        flash.taxProfileModalId,
        taxProfiles,
    );

    const [formOpen, setFormOpen] = useState(initial.open);
    const [formMode, setFormMode] = useState(initial.mode);
    const [editingTaxProfile, setEditingTaxProfile] = useState(initial.taxProfile);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingTaxProfile, setDeletingTaxProfile] =
        useState<TaxProfileRow | null>(null);

    const closeFormModal = useCallback(() => {
        setFormOpen(false);
        setFormMode('create');
        setEditingTaxProfile(null);

        router.visit(taxProfilesIndexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const openCreate = useCallback(() => {
        setFormMode('create');
        setEditingTaxProfile(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((taxProfile: TaxProfileRow) => {
        setFormMode('edit');
        setEditingTaxProfile({
            id: taxProfile.id,
            code: taxProfile.code,
            name: taxProfile.name,
            sunat_affectation_code: taxProfile.sunat_affectation_code,
            igv_rate: taxProfile.igv_rate,
            isc_rate: taxProfile.isc_rate,
            is_default: taxProfile.is_default,
            is_active: taxProfile.is_active,
            sort_order: taxProfile.sort_order,
        });
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((taxProfile: TaxProfileRow) => {
        setDeletingTaxProfile(taxProfile);
        setDeleteOpen(true);
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingTaxProfile(null);
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
        editingTaxProfile,
        deleteOpen,
        deletingTaxProfile,
        openCreate,
        openEdit,
        openDelete,
        handleFormOpenChange,
        handleDeleteOpenChange,
    };
}
