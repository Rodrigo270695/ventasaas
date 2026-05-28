import { Head, usePage } from '@inertiajs/react';
import { ImageIcon } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { StoreCoverDeleteModal } from '@/components/admin/configuracion/store-cover-delete-modal';
import { StoreCoverFormModal } from '@/components/admin/configuracion/store-cover-form-modal';
import { StoreCoversGrid } from '@/components/admin/configuracion/store-covers-grid';
import {
    PageHeader,
    PageHeaderActions,
    PageHeaderBadges,
    PageHeaderNewButton,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { useCan } from '@/hooks/use-can';
import { useStoreCoversModals } from '@/hooks/use-store-covers-modals';
import { configuracionPortadaIndex } from '@/lib/admin-breadcrumbs';
import { STORE_COVERS_PERMISSIONS } from '@/lib/admin-permissions';
import type {
    StoreCoverStatItem,
    StoreCoversIndexPageProps,
    StoreCoversPageErrors,
} from '@/types/admin/store-covers';

type PageProps = StoreCoversIndexPageProps & {
    errors?: StoreCoversPageErrors;
};

export default function PortadaIndex({
    slides,
    stats,
    coverModal = null,
    coverModalSlideId = null,
    oldForm,
}: StoreCoversIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const modals = useStoreCoversModals(slides, {
        coverModal,
        coverModalSlideId,
    });

    const abilities = useMemo(
        () => ({
            canUpdate: can(STORE_COVERS_PERMISSIONS.UPDATE),
            canDelete: can(STORE_COVERS_PERMISSIONS.DELETE),
        }),
        [can],
    );

    const resolveStatIcon = useCallback((stat: StoreCoverStatItem) => {
        if (stat.key === 'total') {
            return ImageIcon;
        }

        return stat.icon;
    }, []);

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Fotos de portada" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Fotos de portada"
                        description="Carrusel principal del catálogo público. Usa imágenes amplias y de alta calidad."
                    />
                    <PageHeaderActions>
                        {can(STORE_COVERS_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton
                                onClick={() => modals.openCreate()}
                                label="Subir foto"
                            />
                        )}
                    </PageHeaderActions>
                </PageHeaderTop>

                <PageHeaderBadges>
                    {stats.map((stat) => (
                        <StatBadge
                            key={stat.key}
                            label={stat.label}
                            value={stat.value}
                            tone={stat.tone}
                            icon={resolveStatIcon(stat)}
                        />
                    ))}
                </PageHeaderBadges>
            </PageHeader>

            <StoreCoversGrid
                slides={slides}
                canUpdate={abilities.canUpdate}
                canDelete={abilities.canDelete}
                onEdit={modals.openEdit}
                onDelete={modals.openDelete}
            />

            {(can(STORE_COVERS_PERMISSIONS.CREATE) ||
                can(STORE_COVERS_PERMISSIONS.UPDATE)) && (
                <StoreCoverFormModal
                    open={modals.formOpen}
                    onOpenChange={modals.handleFormOpenChange}
                    mode={modals.formMode}
                    slide={modals.editingSlide}
                    previewUrl={modals.previewUrl}
                    errors={modals.formOpen ? errors : {}}
                    oldForm={modals.formOpen ? oldForm : undefined}
                />
            )}

            {can(STORE_COVERS_PERMISSIONS.DELETE) && (
                <StoreCoverDeleteModal
                    open={modals.deleteOpen}
                    onOpenChange={modals.handleDeleteOpenChange}
                    slide={modals.deletingSlide}
                />
            )}
        </div>
    );
}

PortadaIndex.layout = {
    breadcrumbs: configuracionPortadaIndex(),
};
