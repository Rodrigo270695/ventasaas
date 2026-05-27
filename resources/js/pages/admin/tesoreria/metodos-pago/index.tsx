import { Head, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { PaymentMethodDeleteModal } from '@/components/admin/tesoreria/payment-method-delete-modal';
import { PaymentMethodFormModal } from '@/components/admin/tesoreria/payment-method-form-modal';
import { PaymentMethodsTable } from '@/components/admin/tesoreria/payment-methods-table';
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
import { usePaymentMethodsModals } from '@/hooks/use-payment-methods-modals';
import { tesoreriaMetodosPagoIndex } from '@/lib/admin-breadcrumbs';
import { TREASURY_PAYMENT_METHODS_PERMISSIONS } from '@/lib/admin-permissions';
import { PAYMENT_METHOD_STAT_ICONS } from '@/lib/treasury-payment-method-stat-icons';
import type {
    PaymentMethodStatItem,
    PaymentMethodsIndexPageProps,
    PaymentMethodsPageErrors,
} from '@/types/admin/treasury';

type PageProps = PaymentMethodsIndexPageProps & {
    errors?: PaymentMethodsPageErrors;
};

export default function PaymentMethodsIndex({
    methods,
    stats,
    paymentMethodModal = null,
    paymentMethodModalId = null,
    oldForm,
    typeOptions,
}: PaymentMethodsIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const [filteredCount, setFilteredCount] = useState(methods.length);

    const modals = usePaymentMethodsModals(methods, {
        paymentMethodModal,
        paymentMethodModalId,
    });

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(TREASURY_PAYMENT_METHODS_PERMISSIONS.UPDATE),
            canDelete: can(TREASURY_PAYMENT_METHODS_PERMISSIONS.DELETE),
        }),
        [can],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: PaymentMethodStatItem) => {
        return stat.icon ?? PAYMENT_METHOD_STAT_ICONS[stat.key];
    }, []);

    const showFilteredBadge = filteredCount !== methods.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Métodos de pago" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Métodos de pago"
                        description="Formas de cobro disponibles al registrar pagos de clientes."
                    />
                    <PageHeaderActions>
                        {can(TREASURY_PAYMENT_METHODS_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton
                                onClick={() => modals.openCreate()}
                                label="Nuevo método"
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

            <PaymentMethodsTable
                methods={methods}
                abilities={tableAbilities}
                onEdit={modals.openEdit}
                onDelete={modals.openDelete}
                onFilteredCountChange={handleFilteredCountChange}
            />

            {(can(TREASURY_PAYMENT_METHODS_PERMISSIONS.CREATE) ||
                can(TREASURY_PAYMENT_METHODS_PERMISSIONS.UPDATE)) && (
                <PaymentMethodFormModal
                    open={modals.formOpen}
                    onOpenChange={modals.handleFormOpenChange}
                    mode={modals.formMode}
                    method={modals.editingMethod}
                    typeOptions={typeOptions}
                    errors={modals.formOpen ? errors : {}}
                    oldForm={modals.formOpen ? oldForm : undefined}
                />
            )}

            {can(TREASURY_PAYMENT_METHODS_PERMISSIONS.DELETE) && (
                <PaymentMethodDeleteModal
                    open={modals.deleteOpen}
                    onOpenChange={modals.handleDeleteOpenChange}
                    method={modals.deletingMethod}
                />
            )}
        </div>
    );
}

PaymentMethodsIndex.layout = {
    breadcrumbs: tesoreriaMetodosPagoIndex(),
};
