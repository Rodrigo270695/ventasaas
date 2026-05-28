import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as portadaIndex } from '@/routes/admin/configuracion/portada';
import type {
    StoreCoverFormValues,
    StoreCoverSlideRow,
    StoreCoversIndexPageProps,
} from '@/types/admin/store-covers';

export type StoreCoversModalFlash = Pick<
    StoreCoversIndexPageProps,
    'coverModal' | 'coverModalSlideId'
>;

type FormState = {
    open: boolean;
    mode: 'create' | 'edit';
    slide: StoreCoverFormValues | null;
    imageUrl: string | null;
};

function buildInitialFormState(
    coverModal: StoreCoversIndexPageProps['coverModal'],
    coverModalSlideId: StoreCoversIndexPageProps['coverModalSlideId'],
    slides: StoreCoverSlideRow[],
): FormState {
    if (coverModal === 'create') {
        return { open: true, mode: 'create', slide: null, imageUrl: null };
    }

    if (coverModal === 'edit' && coverModalSlideId) {
        const slide = slides.find((row) => row.id === coverModalSlideId);

        if (slide) {
            return {
                open: true,
                mode: 'edit',
                slide: {
                    id: slide.id,
                    title: slide.title ?? '',
                    subtitle: slide.subtitle ?? '',
                    is_active: slide.is_active,
                },
                imageUrl: slide.image_url,
            };
        }
    }

    return { open: false, mode: 'create', slide: null, imageUrl: null };
}

const portadaResetUrl = portadaIndex.url({ query: { _reset: 1 } });

export function useStoreCoversModals(
    slides: StoreCoverSlideRow[],
    flash: StoreCoversModalFlash,
) {
    const initial = buildInitialFormState(
        flash.coverModal,
        flash.coverModalSlideId,
        slides,
    );

    const [formOpen, setFormOpen] = useState(initial.open);
    const [formMode, setFormMode] = useState(initial.mode);
    const [editingSlide, setEditingSlide] = useState(initial.slide);
    const [previewUrl, setPreviewUrl] = useState(initial.imageUrl);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingSlide, setDeletingSlide] = useState<StoreCoverSlideRow | null>(
        null,
    );

    const closeFormModal = useCallback(() => {
        setFormOpen(false);
        setFormMode('create');
        setEditingSlide(null);
        setPreviewUrl(null);

        router.visit(portadaResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const openCreate = useCallback(() => {
        setFormMode('create');
        setEditingSlide(null);
        setPreviewUrl(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((slide: StoreCoverSlideRow) => {
        setFormMode('edit');
        setEditingSlide({
            id: slide.id,
            title: slide.title ?? '',
            subtitle: slide.subtitle ?? '',
            is_active: slide.is_active,
        });
        setPreviewUrl(slide.image_url);
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((slide: StoreCoverSlideRow) => {
        setDeletingSlide(slide);
        setDeleteOpen(true);
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingSlide(null);
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
        editingSlide,
        previewUrl,
        deleteOpen,
        deletingSlide,
        openCreate,
        openEdit,
        openDelete,
        handleFormOpenChange,
        handleDeleteOpenChange,
    };
}
