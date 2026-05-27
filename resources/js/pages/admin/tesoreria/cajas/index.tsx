import { Head, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { CashRegisterDeleteModal } from '@/components/admin/tesoreria/cash-register-delete-modal';
import { CashRegisterFormModal } from '@/components/admin/tesoreria/cash-register-form-modal';
import { CashRegistersTable } from '@/components/admin/tesoreria/cash-registers-table';
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
import { useCashRegistersModals } from '@/hooks/use-cash-registers-modals';
import { tesoreriaCajasIndex } from '@/lib/admin-breadcrumbs';
import { TREASURY_CASH_REGISTERS_PERMISSIONS } from '@/lib/admin-permissions';
import { CASH_REGISTER_STAT_ICONS } from '@/lib/treasury-cash-register-stat-icons';
import type {
    CashRegisterStatItem,
    CashRegistersIndexPageProps,
    CashRegistersPageErrors,
} from '@/types/admin/treasury';

type PageProps = CashRegistersIndexPageProps & {
    errors?: CashRegistersPageErrors;
};

export default function CashRegistersIndex({
    registers,
    warehouseOptions,
    stats,
    cashRegisterModal = null,
    cashRegisterModalId = null,
    oldForm,
}: CashRegistersIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();
    const [filteredCount, setFilteredCount] = useState(registers.length);

    const modals = useCashRegistersModals(registers, {
        cashRegisterModal,
        cashRegisterModalId,
    });

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(TREASURY_CASH_REGISTERS_PERMISSIONS.UPDATE),
            canDelete: can(TREASURY_CASH_REGISTERS_PERMISSIONS.DELETE),
        }),
        [can],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: CashRegisterStatItem) => {
        return stat.icon ?? CASH_REGISTER_STAT_ICONS[stat.key];
    }, []);

    const showFilteredBadge = filteredCount !== registers.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Cajas" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Cajas"
                        description="Puntos de cobro para abrir sesiones y controlar efectivo."
                    />
                    <PageHeaderActions>
                        {can(TREASURY_CASH_REGISTERS_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton
                                onClick={() => modals.openCreate()}
                                label="Nueva caja"
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

            <CashRegistersTable
                registers={registers}
                abilities={tableAbilities}
                onEdit={modals.openEdit}
                onDelete={modals.openDelete}
                onFilteredCountChange={handleFilteredCountChange}
            />

            {(can(TREASURY_CASH_REGISTERS_PERMISSIONS.CREATE) ||
                can(TREASURY_CASH_REGISTERS_PERMISSIONS.UPDATE)) && (
                <CashRegisterFormModal
                    open={modals.formOpen}
                    onOpenChange={modals.handleFormOpenChange}
                    mode={modals.formMode}
                    register={modals.editingRegister}
                    warehouseOptions={warehouseOptions}
                    errors={modals.formOpen ? errors : {}}
                    oldForm={modals.formOpen ? oldForm : undefined}
                />
            )}

            {can(TREASURY_CASH_REGISTERS_PERMISSIONS.DELETE) && (
                <CashRegisterDeleteModal
                    open={modals.deleteOpen}
                    onOpenChange={modals.handleDeleteOpenChange}
                    register={modals.deletingRegister}
                />
            )}
        </div>
    );
}

CashRegistersIndex.layout = {
    breadcrumbs: tesoreriaCajasIndex(),
};
