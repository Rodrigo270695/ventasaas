import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, ListFilter } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PurchaseDocumentsTable } from '@/components/admin/compras/purchase-documents-table';
import { DisbursementPaymentEditModal } from '@/components/admin/tesoreria/disbursement-payment-edit-modal';
import { DisbursementPaymentModal } from '@/components/admin/tesoreria/disbursement-payment-modal';
import { PayablePaymentHistoryModal } from '@/components/admin/tesoreria/payable-payment-history-modal';
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
import { comprasFacturasIndex } from '@/lib/admin-breadcrumbs';
import {
    canCreateDisbursements,
    PURCHASES_PERMISSIONS,
} from '@/lib/admin-permissions';
import { getCurrentWeekDateRange } from '@/lib/sales-documents-date-range';
import type {
    PayableDocumentRow,
    TreasuryPaymentHistoryItem,
} from '@/types/admin/treasury';
import type {
    PurchaseDocumentListRow,
    PurchaseDocumentsIndexPageProps,
    PendingReceiptForInvoice,
} from '@/types/admin/purchase-documents';

const INDEX_URL = '/admin/compras/facturas';

const PAYMENT_STATUS_OPTIONS = [
    { value: '', label: 'Todos los pagos' },
    { value: 'unpaid', label: 'Pendiente' },
    { value: 'partial', label: 'Pago parcial' },
    { value: 'paid', label: 'Pagado' },
];

const defaultWeek = getCurrentWeekDateRange();

type PageProps = PurchaseDocumentsIndexPageProps & {
    errors?: Record<string, string>;
};

function toPayableRow(row: PurchaseDocumentListRow): PayableDocumentRow {
    return {
        id: row.id,
        internal_number: row.internal_number,
        supplier_document_number: row.supplier_document_number,
        display_number: row.display_number,
        issue_date: row.issue_date,
        issue_date_label: row.issue_date_label,
        due_date: row.due_date,
        due_date_label: row.due_date_label,
        supplier_name: row.supplier_name,
        supplier_document: row.supplier_document,
        payment_status: row.payment_status,
        payment_status_label: row.payment_status_label,
        amount_paid: row.amount_paid,
        amount_paid_label: row.amount_paid_label,
        balance_due: row.balance_due,
        balance_due_label: row.balance_due_label,
        total: row.total,
        total_label: row.total_label,
        currency_code: row.currency_code,
        can_receive_payment: row.can_receive_payment,
        is_overdue: false,
        days_overdue: 0,
        aging_label: '',
        document_edit_url: `${INDEX_URL}/${row.id}/edit`,
        payment_history: row.payment_history,
    };
}

export default function PurchaseDocumentsIndex({
    documents = [],
    pendingReceipts = [],
    filters,
    stats = [],
    paymentMethods = [],
    canRecordPayment = false,
    canUpdatePayment = false,
    openCashSession = null,
}: PurchaseDocumentsIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();
    const [filteredCount, setFilteredCount] = useState(documents.length);
    const [search, setSearch] = useState(filters.search ?? '');
    const [from, setFrom] = useState(filters.from ?? defaultWeek.from);
    const [to, setTo] = useState(filters.to ?? defaultWeek.to);
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
        setFrom(filters.from ?? defaultWeek.from);
        setTo(filters.to ?? defaultWeek.to);
    }, [filters.search, filters.from, filters.to]);

    const visitWithFilters = useCallback(
        (patch: {
            payment_status?: string;
            search?: string;
            from?: string;
            to?: string;
        }) => {
            router.get(
                INDEX_URL,
                {
                    payment_status:
                        (patch.payment_status !== undefined
                            ? patch.payment_status
                            : filters.payment_status) || undefined,
                    search:
                        (patch.search !== undefined ? patch.search : search) ||
                        undefined,
                    from:
                        (patch.from !== undefined ? patch.from : from) ||
                        undefined,
                    to: (patch.to !== undefined ? patch.to : to) || undefined,
                },
                { preserveState: true, replace: true },
            );
        },
        [filters.payment_status, search, from, to],
    );

    const handleRangeCommit = useCallback(() => {
        visitWithFilters({ from, to });
    }, [visitWithFilters, from, to]);

    const serverFilters = useMemo(
        () => ({
            search,
            paymentStatus: filters.payment_status,
            paymentStatusOptions: PAYMENT_STATUS_OPTIONS,
            onSearchChange: setSearch,
            onSearchCommit: (value?: string) =>
                visitWithFilters({ search: (value ?? search).trim() }),
            onPaymentStatusChange: (payment_status: string) =>
                visitWithFilters({ payment_status }),
        }),
        [search, filters.payment_status, visitWithFilters],
    );

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(PURCHASES_PERMISSIONS.MANAGE),
            canRecordPayment:
                canRecordPayment && canCreateDisbursements(can),
        }),
        [can, canRecordPayment],
    );

    const handleRecordPayment = useCallback((row: PurchaseDocumentListRow) => {
        setPaymentDocument(toPayableRow(row));
        setPaymentModalOpen(true);
    }, []);

    const handleViewPaymentHistory = useCallback(
        (row: PurchaseDocumentListRow) => {
            setHistoryDocument(toPayableRow(row));
            setHistoryModalOpen(true);
        },
        [],
    );

    const handleEditPayment = useCallback(
        (payment: TreasuryPaymentHistoryItem) => {
            setPaymentToEdit(payment);
            setEditPaymentOpen(true);
        },
        [],
    );

    const showFilteredBadge = filteredCount !== documents.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Facturas de compra" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Facturas de compra"
                        description="Flujo recomendado: orden → recepción → factura (productos se arrastran solos). También puedes registrar una factura directa."
                    />
                    <PageHeaderActions>
                        {can(PURCHASES_PERMISSIONS.MANAGE) ? (
                            <div className="flex flex-wrap gap-2">
                                {pendingReceipts.length > 0 ? (
                                    <PageHeaderNewButton
                                        href={
                                            pendingReceipts[0]
                                                .create_invoice_url
                                        }
                                        label="Factura desde recepción"
                                    />
                                ) : null}
                                <Link
                                    href={`${INDEX_URL}/nuevo`}
                                    className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-[#5b21b6] hover:bg-violet-50"
                                >
                                    Factura directa
                                </Link>
                            </div>
                        ) : null}
                    </PageHeaderActions>
                </PageHeaderTop>
                <PageHeaderBadges>
                    {stats.map((stat) => (
                        <StatBadge
                            key={stat.key}
                            label={stat.label}
                            value={String(stat.value)}
                            tone={stat.tone as 'violet'}
                        />
                    ))}
                    {showFilteredBadge ? (
                        <StatBadge
                            label="Resultados"
                            value={String(filteredCount)}
                            tone="pink"
                            icon={ListFilter}
                        />
                    ) : null}
                </PageHeaderBadges>
            </PageHeader>

            {pendingReceipts.length > 0 &&
            can(PURCHASES_PERMISSIONS.MANAGE) ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                        Recepciones sin factura ({pendingReceipts.length})
                    </p>
                    <p className="mt-1 text-xs text-amber-800/90">
                        El stock ya ingresó; solo falta el documento del
                        proveedor. Elige una recepción y los productos se
                        cargan automáticamente.
                    </p>
                    <ul className="mt-3 space-y-2">
                        {pendingReceipts.map((r: PendingReceiptForInvoice) => (
                            <li key={r.id}>
                                <Link
                                    href={r.create_invoice_url}
                                    className="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200/80 bg-white px-3 py-2 text-sm transition-colors hover:border-[#7c3aed] hover:bg-violet-50"
                                >
                                    <span>
                                        <span className="font-mono font-semibold text-[#7c3aed]">
                                            {r.internal_number}
                                        </span>
                                        <span className="text-[#6b5b7a]">
                                            {' '}
                                            · OC {r.purchase_order_number} ·{' '}
                                            {r.supplier_name} ·{' '}
                                            {r.lines_count} ítems ·{' '}
                                            {r.received_date_label}
                                        </span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#7c3aed]">
                                        Crear factura
                                        <ArrowRight className="size-3.5" />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            <PurchaseDocumentsTable
                rows={documents}
                abilities={tableAbilities}
                serverFilters={serverFilters}
                onRecordPayment={handleRecordPayment}
                onViewPaymentHistory={handleViewPaymentHistory}
                onFilteredCountChange={setFilteredCount}
                dateRange={{
                    from,
                    to,
                    onFromChange: setFrom,
                    onToChange: setTo,
                    onRangeCommit: handleRangeCommit,
                }}
            />

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
                    redirect="purchases_index"
                    errors={errors}
                    onSuccess={() => router.reload({ preserveScroll: true })}
                />
            ) : null}

            {tableAbilities.canRecordPayment && paymentMethods.length > 0 ? (
                <DisbursementPaymentModal
                    open={paymentModalOpen}
                    onOpenChange={(open) => {
                        setPaymentModalOpen(open);

                        if (!open) {
                            setPaymentDocument(null);
                        }
                    }}
                    document={paymentDocument}
                    paymentMethods={paymentMethods}
                    openCashSession={openCashSession}
                    redirect="purchases_index"
                    errors={errors}
                />
            ) : null}
        </div>
    );
}

PurchaseDocumentsIndex.layout = () => ({
    breadcrumbs: comprasFacturasIndex(),
});
