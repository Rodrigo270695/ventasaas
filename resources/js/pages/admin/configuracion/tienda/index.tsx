import { Head, router, usePage } from '@inertiajs/react';
import { Pencil, Store } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { StoreSettingsFormModal } from '@/components/admin/configuracion/store-settings-form-modal';
import { StoreSettingsSummary } from '@/components/admin/configuracion/store-settings-summary';
import {
    PageHeader,
    PageHeaderActions,
    PageHeaderBadges,
    PageHeaderNewButton,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { configuracionTiendaIndex } from '@/lib/admin-breadcrumbs';
import { SETTINGS_PERMISSIONS } from '@/lib/admin-permissions';
import { STORE_SETTINGS_STAT_ICONS } from '@/lib/store-settings-stat-icons';
import { index as tiendaIndex } from '@/routes/admin/configuracion/tienda';
import type {
    StoreSettingsStatItem,
    TiendaIndexPageProps,
    StoreSettingsPageErrors,
} from '@/types/admin/store-settings';

type PageProps = TiendaIndexPageProps & {
    errors?: StoreSettingsPageErrors;
};

const tiendaResetUrl = tiendaIndex.url({ query: { _reset: 1 } });

export default function TiendaIndex({
    settings,
    stats,
    storeSettingsModal = false,
    oldForm,
}: TiendaIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const [modalOpen, setModalOpen] = useState(storeSettingsModal);

    useEffect(() => {
        if (storeSettingsModal) {
            setModalOpen(true);
        }
    }, [storeSettingsModal]);

    const openModal = useCallback(() => {
        setModalOpen(true);
    }, []);

    const handleModalOpenChange = useCallback((open: boolean) => {
        setModalOpen(open);

        if (!open) {
            router.visit(tiendaResetUrl, {
                preserveScroll: true,
                replace: true,
            });
        }
    }, []);

    const resolveStatIcon = useCallback((stat: StoreSettingsStatItem) => {
        return stat.icon ?? STORE_SETTINGS_STAT_ICONS[stat.key];
    }, []);

    const canManage = can(SETTINGS_PERMISSIONS.MANAGE);

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Datos de la tienda" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Datos de la tienda"
                        description="RUC, razón social y parámetros de facturación electrónica."
                    />
                    <PageHeaderActions>
                        {canManage &&
                            (settings ? (
                                <Button
                                    type="button"
                                    onClick={openModal}
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-bold text-[#6d28d9] shadow-sm transition-all hover:bg-violet-50"
                                >
                                    <Pencil className="size-4" />
                                    Editar
                                </Button>
                            ) : (
                                <PageHeaderNewButton
                                    onClick={openModal}
                                    label="Configurar tienda"
                                />
                            ))}
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

            {settings ? (
                <StoreSettingsSummary settings={settings} />
            ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200/90 bg-violet-50/40 px-6 py-16 text-center">
                    <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-[#fce7f3] to-[#ede9fe] text-[#7c3aed] shadow-sm ring-1 ring-violet-200/60">
                        <Store className="size-7" strokeWidth={2} />
                    </span>
                    <p className="text-base font-semibold text-[#4c1d95]">
                        Aún no configuraste la tienda
                    </p>
                    <p className="mt-1 max-w-sm text-sm text-[#7c6f8a]">
                        Registra el RUC, ubigeo y datos de facturación para
                        operar y emitir comprobantes más adelante.
                    </p>
                    {canManage && (
                        <PageHeaderNewButton
                            onClick={openModal}
                            label="Configurar tienda"
                            className="mt-6"
                        />
                    )}
                </div>
            )}

            {canManage && (
                <StoreSettingsFormModal
                    open={modalOpen}
                    onOpenChange={handleModalOpenChange}
                    settings={settings}
                    oldForm={oldForm}
                    errors={modalOpen ? errors : {}}
                />
            )}
        </div>
    );
}

TiendaIndex.layout = {
    breadcrumbs: configuracionTiendaIndex(),
};
