import { Head, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { WarehouseDeleteModal } from '@/components/admin/inventario/warehouse-delete-modal';
import { WarehouseFormModal } from '@/components/admin/inventario/warehouse-form-modal';
import { WarehousesTable } from '@/components/admin/inventario/warehouses-table';
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
import { useWarehousesModals } from '@/hooks/use-warehouses-modals';
import { inventarioAlmacenesIndex } from '@/lib/admin-breadcrumbs';
import { WAREHOUSES_PERMISSIONS } from '@/lib/admin-permissions';
import { WAREHOUSE_STAT_ICONS } from '@/lib/warehouse-stat-icons';
import type {
    WarehouseStatItem,
    WarehousesIndexPageProps,
    WarehousesPageErrors,
} from '@/types/admin/warehouses';

type PageProps = WarehousesIndexPageProps & {
    errors?: WarehousesPageErrors;
};

export default function WarehousesIndex({
    warehouses,
    stats,
    warehouseModal = null,
    warehouseModalId = null,
    oldForm,
}: WarehousesIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const [filteredCount, setFilteredCount] = useState(warehouses.length);

    const modals = useWarehousesModals(warehouses, {
        warehouseModal,
        warehouseModalId,
    });

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(WAREHOUSES_PERMISSIONS.UPDATE),
            canDelete: can(WAREHOUSES_PERMISSIONS.DELETE),
        }),
        [can],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: WarehouseStatItem) => {
        return stat.icon ?? WAREHOUSE_STAT_ICONS[stat.key];
    }, []);

    const showFilteredBadge = filteredCount !== warehouses.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Almacenes" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Almacenes"
                        description="Ubicaciones donde se registra stock y costo promedio."
                    />
                    <PageHeaderActions>
                        {can(WAREHOUSES_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton
                                onClick={() => modals.openCreate()}
                                label="Nuevo almacén"
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

            <WarehousesTable
                warehouses={warehouses}
                abilities={tableAbilities}
                onEdit={modals.openEdit}
                onDelete={modals.openDelete}
                onFilteredCountChange={handleFilteredCountChange}
            />

            {(can(WAREHOUSES_PERMISSIONS.CREATE) ||
                can(WAREHOUSES_PERMISSIONS.UPDATE)) && (
                <WarehouseFormModal
                    open={modals.formOpen}
                    onOpenChange={modals.handleFormOpenChange}
                    mode={modals.formMode}
                    warehouse={modals.editingWarehouse}
                    errors={modals.formOpen ? errors : {}}
                    oldForm={modals.formOpen ? oldForm : undefined}
                />
            )}

            {can(WAREHOUSES_PERMISSIONS.DELETE) && (
                <WarehouseDeleteModal
                    open={modals.deleteOpen}
                    onOpenChange={modals.handleDeleteOpenChange}
                    warehouse={modals.deletingWarehouse}
                />
            )}
        </div>
    );
}

WarehousesIndex.layout = {
    breadcrumbs: inventarioAlmacenesIndex(),
};
