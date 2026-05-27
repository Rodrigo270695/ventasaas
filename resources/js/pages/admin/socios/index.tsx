import { Head, usePage } from '@inertiajs/react';
import { CloudOff, ListFilter } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PartiesTable } from '@/components/admin/socios/parties-table';
import { PartyDeleteModal } from '@/components/admin/socios/party-delete-modal';
import { PartyFormModal } from '@/components/admin/socios/party-form-modal';
import {
    PageHeader,
    PageHeaderActions,
    PageHeaderBadges,
    PageHeaderNewButton,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { useCan } from '@/hooks/use-can';
import { useOfflineParties } from '@/hooks/use-offline-parties';
import { usePartiesModals } from '@/hooks/use-parties-modals';
import { sociosIndex } from '@/lib/admin-breadcrumbs';
import { PARTIES_PERMISSIONS } from '@/lib/admin-permissions';
import { notify } from '@/lib/notify';
import { PARTY_STAT_ICONS } from '@/lib/party-stat-icons';
import type {
    PartiesIndexPageProps,
    PartiesPageErrors,
    PartyStatItem,
} from '@/types/admin/parties';

type PageProps = PartiesIndexPageProps & {
    errors?: PartiesPageErrors;
};

export default function PartiesIndex({
    parties: serverParties,
    stats: serverStats,
    partyModal = null,
    partyModalId = null,
    oldForm,
}: PartiesIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const {
        parties,
        stats,
        isOffline,
        pendingCount,
        createOffline,
        updateOffline,
        deleteOffline,
    } = useOfflineParties({
        serverParties,
        serverStats,
    });

    const [filteredCount, setFilteredCount] = useState(parties.length);

    useEffect(() => {
        setFilteredCount(parties.length);
    }, [parties.length]);

    const modals = usePartiesModals(parties, {
        partyModal,
        partyModalId,
        isOffline,
    });

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(PARTIES_PERMISSIONS.UPDATE),
            canDelete: can(PARTIES_PERMISSIONS.DELETE),
        }),
        [can],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: PartyStatItem) => {
        return stat.icon ?? PARTY_STAT_ICONS[stat.key];
    }, []);

    const handleOfflineCreate = useCallback(
        (payload: Parameters<typeof createOffline>[0]) => {
            createOffline(payload);
            notify.success('Socio guardado localmente', {
                description: 'Se sincronizará al reconectar internet.',
            });
        },
        [createOffline],
    );

    const handleOfflineUpdate = useCallback(
        (partyId: string, payload: Parameters<typeof updateOffline>[1]) => {
            updateOffline(partyId, payload);
            notify.success('Cambios guardados localmente', {
                description: 'Se sincronizarán al reconectar internet.',
            });
        },
        [updateOffline],
    );

    const handleOfflineDelete = useCallback(
        (partyId: string) => {
            deleteOffline(partyId);
            notify.success('Eliminación pendiente', {
                description: 'Se aplicará al reconectar internet.',
            });
        },
        [deleteOffline],
    );

    const showFilteredBadge = filteredCount !== parties.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Clientes y proveedores" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Clientes y proveedores"
                        description={
                            isOffline
                                ? 'Sin internet: listado en caché. Puedes crear, editar o eliminar; se sincronizará al reconectar.'
                                : 'Socios de negocio para ventas, compras y facturación electrónica.'
                        }
                    />
                    <PageHeaderActions>
                        {can(PARTIES_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton
                                onClick={() => modals.openCreate()}
                                label="Nuevo socio"
                            />
                        )}
                    </PageHeaderActions>
                </PageHeaderTop>

                <PageHeaderBadges>
                    {isOffline ? (
                        <Badge
                            variant="outline"
                            className="gap-1 border-amber-300 bg-amber-50 text-amber-900"
                        >
                            <CloudOff className="size-3" />
                            Modo offline
                        </Badge>
                    ) : null}
                    {pendingCount > 0 ? (
                        <Badge
                            variant="outline"
                            className="border-violet-300 bg-violet-50 text-violet-900"
                        >
                            {pendingCount} pendiente
                            {pendingCount === 1 ? '' : 's'} de sync
                        </Badge>
                    ) : null}
                    {stats.map((stat) => (
                        <StatBadge
                            key={stat.key}
                            label={stat.label}
                            value={stat.value}
                            tone={stat.tone}
                            icon={resolveStatIcon(stat)}
                        />
                    ))}
                    {showFilteredBadge && (
                        <StatBadge
                            label="Resultados"
                            value={filteredCount}
                            tone="pink"
                            icon={ListFilter}
                        />
                    )}
                </PageHeaderBadges>
            </PageHeader>

            <PartiesTable
                parties={parties}
                abilities={tableAbilities}
                onEdit={modals.openEdit}
                onDelete={modals.openDelete}
                onFilteredCountChange={handleFilteredCountChange}
            />

            {(can(PARTIES_PERMISSIONS.CREATE) ||
                can(PARTIES_PERMISSIONS.UPDATE)) && (
                <PartyFormModal
                    open={modals.formOpen}
                    onOpenChange={modals.handleFormOpenChange}
                    mode={modals.formMode}
                    party={modals.editingParty}
                    errors={modals.formOpen ? errors : {}}
                    oldForm={modals.formOpen ? oldForm : undefined}
                    isOffline={isOffline}
                    onOfflineCreate={handleOfflineCreate}
                    onOfflineUpdate={handleOfflineUpdate}
                />
            )}

            {can(PARTIES_PERMISSIONS.DELETE) && (
                <PartyDeleteModal
                    open={modals.deleteOpen}
                    onOpenChange={modals.handleDeleteOpenChange}
                    party={modals.deletingParty}
                    isOffline={isOffline}
                    onOfflineDelete={handleOfflineDelete}
                />
            )}
        </div>
    );
}

PartiesIndex.layout = {
    breadcrumbs: sociosIndex(),
};
