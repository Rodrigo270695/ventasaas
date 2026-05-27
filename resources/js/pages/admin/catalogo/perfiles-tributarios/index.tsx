import { Head, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { TaxProfileDeleteModal } from '@/components/admin/catalogo/tax-profile-delete-modal';
import { TaxProfileFormModal } from '@/components/admin/catalogo/tax-profile-form-modal';
import { TaxProfilesTable } from '@/components/admin/catalogo/tax-profiles-table';
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
import { useTaxProfilesModals } from '@/hooks/use-tax-profiles-modals';
import { catalogoPerfilesTributariosIndex } from '@/lib/admin-breadcrumbs';
import { TAX_PROFILES_PERMISSIONS } from '@/lib/admin-permissions';
import { TAX_PROFILE_STAT_ICONS } from '@/lib/tax-profile-stat-icons';
import type {
    TaxProfileStatItem,
    TaxProfilesIndexPageProps,
    TaxProfilesPageErrors,
} from '@/types/admin/tax-profiles';

type PageProps = TaxProfilesIndexPageProps & {
    errors?: TaxProfilesPageErrors;
};

export default function TaxProfilesIndex({
    taxProfiles,
    affectationOptions,
    stats,
    taxProfileModal = null,
    taxProfileModalId = null,
    oldForm,
}: TaxProfilesIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const [filteredCount, setFilteredCount] = useState(taxProfiles.length);

    const modals = useTaxProfilesModals(taxProfiles, {
        taxProfileModal,
        taxProfileModalId,
    });

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(TAX_PROFILES_PERMISSIONS.UPDATE),
            canDelete: can(TAX_PROFILES_PERMISSIONS.DELETE),
        }),
        [can],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: TaxProfileStatItem) => {
        return stat.icon ?? TAX_PROFILE_STAT_ICONS[stat.key];
    }, []);

    const showFilteredBadge = filteredCount !== taxProfiles.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Perfiles tributarios" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Perfiles tributarios"
                        description="Afectación SUNAT e IGV para facturación. Asígnalos por variante en cada producto."
                    />
                    <PageHeaderActions>
                        {can(TAX_PROFILES_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton
                                onClick={() => modals.openCreate()}
                                label="Nuevo perfil"
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

            <TaxProfilesTable
                taxProfiles={taxProfiles}
                abilities={tableAbilities}
                onEdit={modals.openEdit}
                onDelete={modals.openDelete}
                onFilteredCountChange={handleFilteredCountChange}
            />

            {(can(TAX_PROFILES_PERMISSIONS.CREATE) ||
                can(TAX_PROFILES_PERMISSIONS.UPDATE)) && (
                <TaxProfileFormModal
                    open={modals.formOpen}
                    onOpenChange={modals.handleFormOpenChange}
                    mode={modals.formMode}
                    taxProfile={modals.editingTaxProfile}
                    affectationOptions={affectationOptions}
                    errors={modals.formOpen ? errors : {}}
                    oldForm={modals.formOpen ? oldForm : undefined}
                />
            )}

            {can(TAX_PROFILES_PERMISSIONS.DELETE) && (
                <TaxProfileDeleteModal
                    open={modals.deleteOpen}
                    onOpenChange={modals.handleDeleteOpenChange}
                    taxProfile={modals.deletingTaxProfile}
                />
            )}
        </div>
    );
}

TaxProfilesIndex.layout = {
    breadcrumbs: catalogoPerfilesTributariosIndex(),
};
