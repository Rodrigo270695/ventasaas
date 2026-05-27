import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as seriesIndex } from '@/routes/admin/documentos/series';
import type {
    DocumentSeriesFormValues,
    DocumentSeriesIndexPageProps,
    DocumentSeriesRow,
} from '@/types/admin/document-series';

export type DocumentSeriesModalFlash = Pick<
    DocumentSeriesIndexPageProps,
    'documentSeriesModal' | 'documentSeriesModalId'
>;

type FormState = {
    open: boolean;
    mode: 'create' | 'edit';
    row: DocumentSeriesFormValues | null;
};

function buildInitialFormState(
    modal: DocumentSeriesIndexPageProps['documentSeriesModal'],
    modalId: DocumentSeriesIndexPageProps['documentSeriesModalId'],
    rows: DocumentSeriesRow[],
): FormState {
    if (modal === 'create') {
        return { open: true, mode: 'create', row: null };
    }

    if (modal === 'edit' && modalId) {
        const row = rows.find((item) => item.id === modalId);

        if (row) {
            return { open: true, mode: 'edit', row: { ...row } };
        }
    }

    return { open: false, mode: 'create', row: null };
}

const indexResetUrl = seriesIndex.url({ query: { _reset: 1 } });

export function useDocumentSeriesModals(
    rows: DocumentSeriesRow[],
    flash: DocumentSeriesModalFlash,
) {
    const initial = buildInitialFormState(
        flash.documentSeriesModal,
        flash.documentSeriesModalId,
        rows,
    );

    const [formOpen, setFormOpen] = useState(initial.open);
    const [formMode, setFormMode] = useState(initial.mode);
    const [editingRow, setEditingRow] = useState(initial.row);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingRow, setDeletingRow] = useState<DocumentSeriesRow | null>(null);

    const closeFormModal = useCallback(() => {
        setFormOpen(false);
        setFormMode('create');
        setEditingRow(null);

        router.visit(indexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const openCreate = useCallback(() => {
        setFormMode('create');
        setEditingRow(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((row: DocumentSeriesRow) => {
        setFormMode('edit');
        setEditingRow({ ...row });
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((row: DocumentSeriesRow) => {
        setDeletingRow(row);
        setDeleteOpen(true);
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingRow(null);
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
        editingRow,
        deleteOpen,
        deletingRow,
        openCreate,
        openEdit,
        openDelete,
        handleFormOpenChange,
        handleDeleteOpenChange,
    };
}
