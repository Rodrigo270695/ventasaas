import { Link } from '@inertiajs/react';
import { Banknote } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { ReceivablesFiltersToolbar } from '@/components/admin/tesoreria/receivables-filters-toolbar';
import { Button } from '@/components/ui/button';
import {
    treasuryAccountsTd,
    treasuryAccountsTh,
    treasuryColAging,
    treasuryColBalance,
    treasuryColDates,
    treasuryColInvoice,
    treasuryColParty,
} from '@/lib/treasury-accounts-table-columns';
import { cn } from '@/lib/utils';
import type {
    ReceivableAgingFilter,
    ReceivableDocumentRow,
} from '@/types/admin/treasury';
import type { SalesDocumentListRow } from '@/types/admin/sales-documents';

type ServerSearchProps = {
    value: string;
    onChange: (value: string) => void;
    onCommit: () => void;
    placeholder?: string;
};

type DateRangeProps = {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    onRangeCommit: () => void;
};

type Props = {
    documents: ReceivableDocumentRow[];
    canRecordPayment?: boolean;
    onRecordPayment?: (row: SalesDocumentListRow) => void;
    onFilteredCountChange?: (count: number) => void;
    serverSearch?: ServerSearchProps;
    dateRange?: DateRangeProps;
    aging: ReceivableAgingFilter | '';
    onAgingChange: (value: ReceivableAgingFilter | '') => void;
    paymentStatus: string;
    onPaymentStatusChange: (value: string) => void;
};

function PaymentStatusBadge({
    status,
    label,
}: {
    status: string;
    label: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
                status === 'paid' &&
                    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
                status === 'partial' &&
                    'bg-sky-50 text-sky-700 ring-1 ring-sky-200/80',
                status === 'unpaid' &&
                    'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
            )}
        >
            {label}
        </span>
    );
}

function toPaymentRow(row: ReceivableDocumentRow): SalesDocumentListRow {
    return {
        id: row.id,
        full_number: row.full_number,
        document_type_label: row.document_type_label,
        series: '',
        issue_date: row.issue_date,
        issue_date_label: row.issue_date_label ?? row.issue_date,
        customer_name: row.customer_name,
        customer_document: row.customer_document,
        status: 'confirmed',
        status_label: 'Confirmado',
        payment_status: row.payment_status as SalesDocumentListRow['payment_status'],
        payment_status_label: row.payment_status_label,
        amount_paid: row.amount_paid,
        amount_paid_label: row.amount_paid_label,
        balance_due: row.balance_due,
        balance_due_label: row.balance_due_label,
        can_receive_payment: row.can_receive_payment,
        total: row.total,
        total_label: row.total_label,
        currency_code: row.currency_code,
        is_internal: row.is_internal,
    };
}

export function AccountsReceivableTable({
    documents,
    canRecordPayment = false,
    onRecordPayment,
    onFilteredCountChange,
    serverSearch,
    dateRange,
    aging,
    onAgingChange,
    paymentStatus,
    onPaymentStatusChange,
}: Props) {
    const columns = useMemo<DataTableColumn<ReceivableDocumentRow>[]>(
        () => [
            {
                id: 'document',
                header: 'Comprobante',
                primary: true,
                sortable: true,
                sortValue: (row) => row.full_number,
                headerClassName: cn(treasuryAccountsTh, treasuryColInvoice),
                cellClassName: treasuryAccountsTd,
                cell: (row) => (
                    <Link
                        href={row.document_edit_url}
                        className="block truncate font-mono text-[11px] font-semibold text-[#7c3aed] hover:underline"
                        title={row.full_number}
                    >
                        {row.full_number}
                    </Link>
                ),
            },
            {
                id: 'customer',
                header: 'Cliente',
                sortable: true,
                sortValue: (row) => row.customer_name,
                truncate: true,
                headerClassName: cn(treasuryAccountsTh, treasuryColParty),
                cellClassName: cn(treasuryAccountsTd, 'min-w-0'),
                cell: (row) => (
                    <span
                        className="block min-w-0 truncate"
                        title={
                            row.customer_document
                                ? `${row.customer_name} · ${row.customer_document}`
                                : row.customer_name
                        }
                    >
                        {row.customer_name}
                    </span>
                ),
            },
            {
                id: 'dates',
                header: 'Fechas',
                sortable: true,
                sortValue: (row) => row.issue_date,
                hideOnMobile: true,
                headerClassName: cn(
                    treasuryAccountsTh,
                    treasuryColDates,
                    'whitespace-nowrap',
                ),
                cellClassName: cn(
                    treasuryAccountsTd,
                    'whitespace-nowrap text-[11px] text-[#6b5b7a]',
                ),
                cell: (row) => (
                    <div className="leading-tight">
                        <div>{row.issue_date_label ?? '—'}</div>
                        {row.due_date_label ? (
                            <div className="text-[#9d8fb0]">
                                V. {row.due_date_label}
                            </div>
                        ) : null}
                    </div>
                ),
            },
            {
                id: 'aging',
                header: 'Plazo',
                sortable: true,
                sortValue: (row) => row.days_overdue,
                mobileLabel: 'Plazo',
                headerClassName: cn(treasuryAccountsTh, treasuryColAging),
                cellClassName: treasuryAccountsTd,
                cell: (row) => (
                    <div className="space-y-1">
                        <span
                            className={cn(
                                'block text-[11px] font-semibold leading-tight',
                                row.is_overdue
                                    ? 'text-amber-700'
                                    : 'text-[#6b5b7a]',
                            )}
                        >
                            {row.aging_label}
                        </span>
                        <PaymentStatusBadge
                            status={row.payment_status}
                            label={row.payment_status_label}
                        />
                    </div>
                ),
            },
            {
                id: 'balance',
                header: 'Saldo',
                sortable: true,
                sortValue: (row) => parseFloat(row.balance_due),
                headerClassName: cn(
                    treasuryAccountsTh,
                    treasuryColBalance,
                    'text-right',
                ),
                cellClassName: cn(
                    treasuryAccountsTd,
                    'text-right whitespace-nowrap',
                ),
                cell: (row) => (
                    <span
                        className="font-semibold tabular-nums text-[#6d28d9]"
                        title={`Total ${row.currency_code} ${row.total_label}`}
                    >
                        <span className="text-[10px] font-medium text-[#9d8fb0]">
                            {row.currency_code}{' '}
                        </span>
                        {row.balance_due_label}
                    </span>
                ),
            },
        ],
        [],
    );

    const getSearchText = useCallback(
        (row: ReceivableDocumentRow) =>
            [
                row.full_number,
                row.customer_name,
                row.customer_document,
            ]
                .filter(Boolean)
                .join(' '),
        [],
    );

    const renderActions = useCallback(
        (row: ReceivableDocumentRow) =>
            canRecordPayment && onRecordPayment && row.can_receive_payment ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 cursor-pointer rounded-lg text-emerald-600 transition-all duration-200 hover:bg-emerald-600 hover:text-white hover:shadow-md hover:shadow-emerald-300/40 active:scale-95"
                    onClick={() => onRecordPayment(toPaymentRow(row))}
                    aria-label={`Cobrar ${row.full_number}`}
                >
                    <Banknote className="size-4" />
                </Button>
            ) : null,
        [canRecordPayment, onRecordPayment],
    );

    const listToolbar = useMemo(
        () =>
            dateRange ? (
                <ReceivablesFiltersToolbar
                    {...dateRange}
                    aging={aging}
                    onAgingChange={onAgingChange}
                    paymentStatus={paymentStatus}
                    onPaymentStatusChange={onPaymentStatusChange}
                />
            ) : null,
        [
            aging,
            dateRange,
            onAgingChange,
            onPaymentStatusChange,
            paymentStatus,
        ],
    );

    return (
        <DataTable
            data={documents}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar comprobante o cliente…"
            emptyMessage="No hay saldos pendientes de cobro."
            emptyFilteredMessage="Ningún documento coincide con tu búsqueda."
            defaultSort={{ columnId: 'dates', direction: 'desc' }}
            onFilteredCountChange={onFilteredCountChange}
            serverSearch={serverSearch}
            toolbarEnd={listToolbar}
            renderActions={renderActions}
            actionsHeader=""
            className="min-w-0 [&_table]:table-fixed [&_thead_th:last-child]:w-18 [&_tbody_td:last-child]:w-18"
        />
    );
}
