import { Head, Link, router, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountsPayableTable } from '@/components/admin/tesoreria/accounts-payable-table';
import { DisbursementPaymentEditModal } from '@/components/admin/tesoreria/disbursement-payment-edit-modal';
import { DisbursementPaymentModal } from '@/components/admin/tesoreria/disbursement-payment-modal';
import { PayablePaymentHistoryModal } from '@/components/admin/tesoreria/payable-payment-history-modal';
import {
    PageHeader,
    PageHeaderBadges,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { tesoreriaCuentasPorPagarIndex } from '@/lib/admin-breadcrumbs';
import {
    canCreateDisbursements,
    PURCHASES_PERMISSIONS,
} from '@/lib/admin-permissions';
import { useCan } from '@/hooks/use-can';
import type {
    AccountsPayableIndexPageProps,
    PayableAgingFilter,
    PayableDocumentRow,
    PayableStatItem,
    TreasuryPaymentHistoryItem,
} from '@/types/admin/treasury';

const INDEX_URL = '/admin/tesoreria/cuentas-por-pagar';
const COMPRAS_URL = '/admin/compras/facturas';

type PageProps = AccountsPayableIndexPageProps & {
    errors?: Record<string, string>;
};

export default function AccountsPayableIndex({
    documents = [],
    filters,
    stats = [],
    paymentMethods = [],
    canRecordPayment = false,
    canUpdatePayment = false,
    openCashSession = null,
}: AccountsPayableIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();
    const [filteredCount, setFilteredCount] = useState(documents.length);
    const [search, setSearch] = useState(filters.search ?? '');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [aging, setAging] = useState<PayableAgingFilter | ''>(
        filters.aging ?? '',
    );
    const [paymentStatus, setPaymentStatus] = useState(
        filters.payment_status ?? '',
    );
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentDocument, setPaymentDocument] =
        useState<PayableDocumentRow | null>(null);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyDocument, setHistoryDocument] =
        useState<PayableDocumentRow | null>(null);
    const [editPaymentOpen, setEditPaymentOpen] = useState(false);
    const [paymentToEdit, setPaymentToEdit] =
        useState<TreasuryPaymentHistoryItem | null>(null);

    useEffect(() => {
        setSearch(filters.search ?? '');
        setFrom(filters.from ?? '');
        setTo(filters.to ?? '');
        setAging(filters.aging ?? '');
        setPaymentStatus(filters.payment_status ?? '');
    }, [
        filters.search,
        filters.from,
        filters.to,
        filters.aging,
        filters.payment_status,
    ]);

    const visitWithFilters = useCallback(
        (patch: {
            search?: string;
            from?: string;
            to?: string;
            aging?: PayableAgingFilter | '';
            payment_status?: string;
        }) => {
            router.get(
                INDEX_URL,
                {
                    search:
                        (patch.search !== undefined
                            ? patch.search
                            : search) || undefined,
                    from:
                        (patch.from !== undefined ? patch.from : from) ||
                        undefined,
                    to:
                        (patch.to !== undefined ? patch.to : to) || undefined,
                    aging:
                        (patch.aging !== undefined ? patch.aging : aging) ||
                        undefined,
                    payment_status:
                        (patch.payment_status !== undefined
                            ? patch.payment_status
                            : paymentStatus) || undefined,
                },
                { preserveState: true, replace: true },
            );
        },
        [search, from, to, aging, paymentStatus],
    );

    const handleSearchCommit = useCallback(() => {
        visitWithFilters({ search });
    }, [visitWithFilters, search]);

    const handleRangeCommit = useCallback(() => {
        visitWithFilters({ from, to });
    }, [visitWithFilters, from, to]);

    const handleAgingChange = useCallback(
        (value: PayableAgingFilter | '') => {
            setAging(value);
            visitWithFilters({ aging: value });
        },
        [visitWithFilters],
    );

    const handlePaymentStatusChange = useCallback(
        (value: string) => {
            setPaymentStatus(value);
            visitWithFilters({ payment_status: value });
        },
        [visitWithFilters],
    );

    const applyStatFilter = useCallback(
        (stat: PayableStatItem) => {
            if (stat.filter?.aging === 'overdue') {
                setAging('overdue');
                visitWithFilters({ aging: 'overdue' });
            }
        },
        [visitWithFilters],
    );

    const showPaymentModal =
        canRecordPayment && canCreateDisbursements(can) && paymentMethods.length > 0;

    const handleRecordPayment = useCallback((row: PayableDocumentRow) => {
        setPaymentDocument(row);
        setPaymentModalOpen(true);
    }, []);

    const handleViewPaymentHistory = useCallback((row: PayableDocumentRow) => {
        setHistoryDocument(row);
        setHistoryModalOpen(true);
    }, []);

    const handleEditPayment = useCallback(
        (payment: TreasuryPaymentHistoryItem) => {
            setPaymentToEdit(payment);
            setEditPaymentOpen(true);
        },
        [],
    );

    const statBadges = useMemo(
        () =>
            stats.map((stat) => (
                <StatBadge
                    key={stat.key}
                    label={stat.label}
                    value={stat.value}
                    tone={stat.tone}
                    active={
                        stat.filter?.aging === 'overdue' &&
                        aging === 'overdue'
                    }
                    onClick={
                        stat.filter?.aging
                            ? () => applyStatFilter(stat)
                            : undefined
                    }
                />
            )),
        [stats, aging, applyStatFilter],
    );

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Cuentas por pagar" />

            <PageHeader className="mb-0 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Cuentas por pagar"
                        description="Solo saldos pendientes de facturas ya registradas en Compras. Para ingresar mercadería y adjuntar la factura física, usa Facturas de compra."
                    />
                    <PageHeaderBadges>{statBadges}</PageHeaderBadges>
                </PageHeaderTop>
            </PageHeader>

            {showPaymentModal && paymentDocument ? (
                <DisbursementPaymentModal
                    open={paymentModalOpen}
                    onOpenChange={setPaymentModalOpen}
                    document={paymentDocument}
                    paymentMethods={paymentMethods}
                    openCashSession={openCashSession}
                    redirect="payables_index"
                    errors={errors}
                />
            ) : null}

            {historyDocument ? (
                <PayablePaymentHistoryModal
                    open={historyModalOpen}
                    onOpenChange={(open) => {
                        setHistoryModalOpen(open);

                        if (!open) {
                            setHistoryDocument(null);
                        }
                    }}
                    document={historyDocument}
                    canEdit={canUpdatePayment}
                    onEditPayment={handleEditPayment}
                />
            ) : null}

            {paymentToEdit ? (
                <DisbursementPaymentEditModal
                    open={editPaymentOpen}
                    onOpenChange={(open) => {
                        setEditPaymentOpen(open);

                        if (!open) {
                            setPaymentToEdit(null);
                        }
                    }}
                    payment={paymentToEdit}
                    redirect="payables_index"
                    errors={errors}
                    onSuccess={() => {
                        router.reload({ preserveScroll: true });
                    }}
                />
            ) : null}

            {filteredCount !== documents.length ? (
                <div className="flex items-center gap-2 text-xs text-[#6b5b7a]">
                    <ListFilter className="size-3.5 shrink-0" />
                    <span>
                        {filteredCount} de {documents.length} documentos
                    </span>
                </div>
            ) : null}

            {documents.length === 0 && can(PURCHASES_PERMISSIONS.MANAGE) ? (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 px-4 py-6 text-center text-sm text-[#6b5b7a]">
                    <p>No hay saldos pendientes.</p>
                    <Button
                        asChild
                        variant="link"
                        className="mt-2 cursor-pointer text-[#7c3aed]"
                    >
                        <Link href={`${COMPRAS_URL}/nuevo`}>
                            Registrar compra con productos en Compras →
                        </Link>
                    </Button>
                </div>
            ) : null}

            <AccountsPayableTable
                documents={documents}
                canRecordPayment={showPaymentModal}
                onRecordPayment={handleRecordPayment}
                onViewPaymentHistory={handleViewPaymentHistory}
                onFilteredCountChange={setFilteredCount}
                serverSearch={{
                    value: search,
                    onChange: setSearch,
                    onCommit: handleSearchCommit,
                }}
                dateRange={{
                    from,
                    to,
                    onFromChange: setFrom,
                    onToChange: setTo,
                    onRangeCommit: handleRangeCommit,
                }}
                aging={aging}
                onAgingChange={handleAgingChange}
                paymentStatus={paymentStatus}
                onPaymentStatusChange={handlePaymentStatusChange}
            />
        </div>
    );
}

AccountsPayableIndex.layout = () => ({
    breadcrumbs: tesoreriaCuentasPorPagarIndex(),
});
