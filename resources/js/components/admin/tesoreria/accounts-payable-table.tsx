import { Link } from '@inertiajs/react';
import { History, Wallet } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { ReceivablesFiltersToolbar } from '@/components/admin/tesoreria/receivables-filters-toolbar';
import { Button } from '@/components/ui/button';
import { hasPayablePaymentHistory } from '@/lib/payable-payment-history';
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
    PayableAgingFilter,
    PayableDocumentRow,
} from '@/types/admin/treasury';

type ServerSearchProps = {
    value: string;
    onChange: (value: string) => void;
    onCommit: () => void;
};

type DateRangeProps = {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    onRangeCommit: () => void;
};

type Props = {
    documents: PayableDocumentRow[];
    canRecordPayment?: boolean;
    onRecordPayment?: (row: PayableDocumentRow) => void;
    onViewPaymentHistory?: (row: PayableDocumentRow) => void;
    onFilteredCountChange?: (count: number) => void;
    serverSearch?: ServerSearchProps;
    dateRange?: DateRangeProps;
    aging: PayableAgingFilter | '';
    onAgingChange: (value: PayableAgingFilter | '') => void;
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

export function AccountsPayableTable({
    documents,
    canRecordPayment = false,
    onRecordPayment,
    onViewPaymentHistory,
    onFilteredCountChange,
    serverSearch,
    dateRange,
    aging,
    onAgingChange,
    paymentStatus,
    onPaymentStatusChange,
}: Props) {
    const columns = useMemo<DataTableColumn<PayableDocumentRow>[]>(
        () => [
            {
                id: 'document',
                header: 'Factura',
                primary: true,
                sortable: true,
                sortValue: (row) => row.internal_number,
                headerClassName: cn(treasuryAccountsTh, treasuryColInvoice),
                cellClassName: treasuryAccountsTd,
                cell: (row) => (
                    <Link
                        href={row.document_edit_url}
                        className="block truncate font-mono text-[11px] font-semibold text-[#7c3aed] hover:underline"
                        title={row.display_number}
                    >
                        {row.internal_number}
                    </Link>
                ),
            },
            {
                id: 'supplier',
                header: 'Proveedor',
                sortable: true,
                sortValue: (row) => row.supplier_name,
                truncate: true,
                headerClassName: cn(treasuryAccountsTh, treasuryColParty),
                cellClassName: cn(treasuryAccountsTd, 'min-w-0'),
                cell: (row) => (
                    <span
                        className="block min-w-0 truncate"
                        title={
                            row.supplier_document
                                ? `${row.supplier_name} · ${row.supplier_document}`
                                : row.supplier_name
                        }
                    >
                        {row.supplier_name}
                    </span>
                ),
            },
            {
                id: 'dates',
                header: 'Fechas',
                sortable: true,
                sortValue: (row) => row.issue_date,
                hideOnMobile: true,
                headerClassName: cn(treasuryAccountsTh, treasuryColDates),
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
                    <span className="font-semibold tabular-nums text-amber-800">
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
        (row: PayableDocumentRow) =>
            [
                row.internal_number,
                row.supplier_document_number,
                row.supplier_name,
                row.supplier_document,
            ]
                .filter(Boolean)
                .join(' '),
        [],
    );

    const renderActions = useCallback(
        (row: PayableDocumentRow) => {
            const showHistory =
                onViewPaymentHistory && hasPayablePaymentHistory(row);
            const showPay =
                canRecordPayment &&
                onRecordPayment &&
                row.can_receive_payment;

            if (!showHistory && !showPay) {
                return null;
            }

            return (
                <div className="flex items-center justify-end gap-1">
                    {showHistory ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                            onClick={() => onViewPaymentHistory(row)}
                            aria-label={`Historial de pagos ${row.internal_number}`}
                        >
                            <History className="size-4" />
                        </Button>
                    ) : null}
                    {showPay ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 cursor-pointer rounded-lg text-amber-700 transition-all duration-200 hover:bg-amber-600 hover:text-white hover:shadow-md hover:shadow-amber-300/40 active:scale-95"
                            onClick={() => onRecordPayment(row)}
                            aria-label={`Pagar ${row.internal_number}`}
                        >
                            <Wallet className="size-4" />
                        </Button>
                    ) : null}
                </div>
            );
        },
        [canRecordPayment, onRecordPayment, onViewPaymentHistory],
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
            searchPlaceholder="Buscar factura o proveedor…"
            emptyMessage="No hay saldos pendientes con proveedores."
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
