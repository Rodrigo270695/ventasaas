import { Head, router, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccountsReceivableTable } from '@/components/admin/tesoreria/accounts-receivable-table';
import { CollectionPaymentModal } from '@/components/admin/ventas/collection-payment-modal';
import {
    PageHeader,
    PageHeaderBadges,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { tesoreriaCuentasPorCobrarIndex } from '@/lib/admin-breadcrumbs';
import { TREASURY_COLLECTIONS_PERMISSIONS } from '@/lib/admin-permissions';
import { useCan } from '@/hooks/use-can';
import type { SalesDocumentListRow } from '@/types/admin/sales-documents';
import type {
    AccountsReceivableIndexPageProps,
    ReceivableAgingFilter,
    ReceivableStatItem,
} from '@/types/admin/treasury';

const INDEX_URL = '/admin/tesoreria/cuentas-por-cobrar';

type PageProps = AccountsReceivableIndexPageProps & {
    errors?: Record<string, string>;
};

export default function AccountsReceivableIndex({
    documents = [],
    filters,
    stats = [],
    paymentMethods = [],
    canRecordPayment = false,
    openCashSession = null,
}: AccountsReceivableIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();
    const [filteredCount, setFilteredCount] = useState(documents.length);
    const [search, setSearch] = useState(filters.search ?? '');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [aging, setAging] = useState<ReceivableAgingFilter | ''>(
        filters.aging ?? '',
    );
    const [paymentStatus, setPaymentStatus] = useState(
        filters.payment_status ?? '',
    );
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentDocument, setPaymentDocument] =
        useState<SalesDocumentListRow | null>(null);

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
            aging?: ReceivableAgingFilter | '';
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
        (value: ReceivableAgingFilter | '') => {
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
        (stat: ReceivableStatItem) => {
            if (stat.filter?.aging === 'overdue') {
                setAging('overdue');
                visitWithFilters({ aging: 'overdue' });
            }
        },
        [visitWithFilters],
    );

    const showPaymentModal =
        canRecordPayment &&
        can(TREASURY_COLLECTIONS_PERMISSIONS.CREATE) &&
        paymentMethods.length > 0;

    const handleRecordPayment = useCallback((row: SalesDocumentListRow) => {
        setPaymentDocument(row);
        setPaymentModalOpen(true);
    }, []);

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
            <Head title="Cuentas por cobrar" />

            <PageHeader className="mb-0 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Cuentas por cobrar"
                        description="Comprobantes confirmados con saldo pendiente. Registra cobros parciales o totales."
                    />
                    <PageHeaderBadges>{statBadges}</PageHeaderBadges>
                </PageHeaderTop>
            </PageHeader>

            {showPaymentModal && paymentDocument ? (
                <CollectionPaymentModal
                    open={paymentModalOpen}
                    onOpenChange={setPaymentModalOpen}
                    document={paymentDocument}
                    paymentMethods={paymentMethods}
                    openCashSession={openCashSession}
                    redirect="receivables_index"
                    errors={errors}
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

            <AccountsReceivableTable
                documents={documents}
                canRecordPayment={showPaymentModal}
                onRecordPayment={handleRecordPayment}
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

AccountsReceivableIndex.layout = () => ({
    breadcrumbs: tesoreriaCuentasPorCobrarIndex(),
});
