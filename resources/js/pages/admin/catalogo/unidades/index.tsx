import { Head, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { UnitDeleteModal } from '@/components/admin/catalogo/unit-delete-modal';
import { UnitFormModal } from '@/components/admin/catalogo/unit-form-modal';
import { UnitsTable } from '@/components/admin/catalogo/units-table';
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
import { useUnitsModals } from '@/hooks/use-units-modals';
import { catalogoUnidadesIndex } from '@/lib/admin-breadcrumbs';
import { UNITS_PERMISSIONS } from '@/lib/admin-permissions';
import { UNIT_STAT_ICONS } from '@/lib/unit-stat-icons';
import type {
    UnitStatItem,
    UnitsIndexPageProps,
    UnitsPageErrors,
} from '@/types/admin/units';

type PageProps = UnitsIndexPageProps & {
    errors?: UnitsPageErrors;
};

export default function UnitsIndex({
    units,
    stats,
    unitModal = null,
    unitModalUnitId = null,
    oldForm,
}: UnitsIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const [filteredCount, setFilteredCount] = useState(units.length);

    const modals = useUnitsModals(units, {
        unitModal,
        unitModalUnitId,
    });

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(UNITS_PERMISSIONS.UPDATE),
            canDelete: can(UNITS_PERMISSIONS.DELETE),
        }),
        [can],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: UnitStatItem) => {
        return stat.icon ?? UNIT_STAT_ICONS[stat.key];
    }, []);

    const showFilteredBadge = filteredCount !== units.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Unidades de medida" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Unidades de medida"
                        description="Unidades para productos y comprobantes electrónicos."
                    />
                    <PageHeaderActions>
                        {can(UNITS_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton
                                onClick={() => modals.openCreate()}
                                label="Nueva unidad"
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

            <UnitsTable
                units={units}
                abilities={tableAbilities}
                onEdit={modals.openEdit}
                onDelete={modals.openDelete}
                onFilteredCountChange={handleFilteredCountChange}
            />

            {(can(UNITS_PERMISSIONS.CREATE) ||
                can(UNITS_PERMISSIONS.UPDATE)) && (
                <UnitFormModal
                    open={modals.formOpen}
                    onOpenChange={modals.handleFormOpenChange}
                    mode={modals.formMode}
                    unit={modals.editingUnit}
                    errors={modals.formOpen ? errors : {}}
                    oldForm={modals.formOpen ? oldForm : undefined}
                />
            )}

            {can(UNITS_PERMISSIONS.DELETE) && (
                <UnitDeleteModal
                    open={modals.deleteOpen}
                    onOpenChange={modals.handleDeleteOpenChange}
                    unit={modals.deletingUnit}
                />
            )}
        </div>
    );
}

UnitsIndex.layout = {
    breadcrumbs: catalogoUnidadesIndex(),
};
