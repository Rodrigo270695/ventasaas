import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as partiesIndex } from '@/routes/admin/socios';
import type {
    PartiesIndexPageProps,
    PartyFormValues,
    PartyRow,
} from '@/types/admin/parties';

export type PartiesModalFlash = Pick<
    PartiesIndexPageProps,
    'partyModal' | 'partyModalId'
> & {
    isOffline?: boolean;
};

type FormState = {
    open: boolean;
    mode: 'create' | 'edit';
    party: PartyFormValues | null;
};

function buildInitialFormState(
    partyModal: PartiesIndexPageProps['partyModal'],
    partyModalId: PartiesIndexPageProps['partyModalId'],
    parties: PartyRow[],
): FormState {
    if (partyModal === 'create') {
        return { open: true, mode: 'create', party: null };
    }

    if (partyModal === 'edit' && partyModalId) {
        const party = parties.find((row) => row.id === partyModalId);

        if (party) {
            return { open: true, mode: 'edit', party: { ...party } };
        }
    }

    return { open: false, mode: 'create', party: null };
}

const partiesIndexResetUrl = partiesIndex.url({
    query: { _reset: 1 },
});

export function usePartiesModals(parties: PartyRow[], flash: PartiesModalFlash) {
    const initial = buildInitialFormState(
        flash.partyModal,
        flash.partyModalId,
        parties,
    );

    const [formOpen, setFormOpen] = useState(initial.open);
    const [formMode, setFormMode] = useState(initial.mode);
    const [editingParty, setEditingParty] = useState(initial.party);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingParty, setDeletingParty] = useState<PartyRow | null>(null);

    const closeFormModal = useCallback(() => {
        setFormOpen(false);
        setFormMode('create');
        setEditingParty(null);

        if (flash.isOffline) {
            return;
        }

        router.visit(partiesIndexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, [flash.isOffline]);

    const openCreate = useCallback(() => {
        setFormMode('create');
        setEditingParty(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((party: PartyRow) => {
        setFormMode('edit');
        setEditingParty({ ...party });
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((party: PartyRow) => {
        setDeletingParty(party);
        setDeleteOpen(true);
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingParty(null);
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
        editingParty,
        deleteOpen,
        deletingParty,
        openCreate,
        openEdit,
        openDelete,
        handleFormOpenChange,
        handleDeleteOpenChange,
    };
}
