import { Banknote, History, Pencil } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import {
    AdminListStatusFilter,
    type AdminListStatusOption,
} from '@/components/admin/admin-list-status-filter';
import { DateRangeFiltersToolbar } from '@/components/admin/date-range-filters-toolbar';
import { ListTableFiltersToolbar } from '@/components/admin/list-table-filters-toolbar';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { hasPayablePaymentHistory } from '@/lib/payable-payment-history';
import {
    purchaseTableIconBtnAmber,
    purchaseTableIconBtnViolet,
} from '@/lib/purchase-form-styles';
import { cn } from '@/lib/utils';
import type { PurchaseDocumentListRow } from '@/types/admin/purchase-documents';
import type { PayableDocumentRow } from '@/types/admin/treasury';

export type PurchaseDocumentsTableAbilities = {
    canUpdate: boolean;
    canRecordPayment?: boolean;
};

export type PurchaseDocumentsServerFilters = {
    search: string;
    paymentStatus: string | null | undefined;
    paymentStatusOptions: AdminListStatusOption[];
    onSearchChange: (value: string) => void;
    onSearchCommit: (value?: string) => void;
    onPaymentStatusChange: (status: string) => void;
};

type DateRangeProps = {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    onRangeCommit: () => void;
};

type Props = {
    rows: PurchaseDocumentListRow[];
    abilities: PurchaseDocumentsTableAbilities;
    serverFilters: PurchaseDocumentsServerFilters;
    editBasePath?: string;
    onRecordPayment?: (row: PurchaseDocumentListRow) => void;
    onViewPaymentHistory?: (row: PurchaseDocumentListRow) => void;
    onFilteredCountChange?: (count: number) => void;
    dateRange?: DateRangeProps;
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
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
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

export function PurchaseDocumentsTable({
    rows,
    abilities,
    serverFilters,
    editBasePath = '/admin/compras/facturas',
    onRecordPayment,
    onViewPaymentHistory,
    onFilteredCountChange,
    dateRange,
}: Props) {
    const columns = useMemo<DataTableColumn<PurchaseDocumentListRow>[]>(
        () => [
            {
                id: 'number',
                header: 'Factura',
                primary: true,
                sortable: true,
                sortValue: (row) => row.internal_number,
                cell: (row) => (
                    <Link
                        href={`${editBasePath}/${row.id}/edit`}
                        className="font-mono text-sm font-semibold text-[#7c3aed] hover:underline"
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
                cell: (row) => (
                    <span className="block truncate" title={row.supplier_name}>
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
                cell: (row) => (
                    <div className="text-sm text-[#6b5b7a]">
                        <div>{row.issue_date_label ?? '—'}</div>
                        {row.due_date_label ? (
                            <div className="text-xs text-[#9d8fb0]">
                                V. {row.due_date_label}
                            </div>
                        ) : null}
                    </div>
                ),
            },
            {
                id: 'payment',
                header: 'Pago',
                sortable: true,
                sortValue: (row) => row.payment_status,
                cell: (row) => (
                    <PaymentStatusBadge
                        status={row.payment_status}
                        label={row.payment_status_label}
                    />
                ),
            },
            {
                id: 'total',
                header: 'Total',
                sortable: true,
                sortValue: (row) => parseFloat(row.total),
                cell: (row) => (
                    <span className="font-semibold tabular-nums">
                        {row.currency_code} {row.total_label}
                    </span>
                ),
            },
            {
                id: 'balance',
                header: 'Saldo',
                sortable: true,
                sortValue: (row) => parseFloat(row.balance_due),
                cell: (row) =>
                    parseFloat(row.balance_due) > 0 ? (
                        <span className="font-semibold tabular-nums text-amber-800">
                            {row.currency_code} {row.balance_due_label}
                        </span>
                    ) : (
                        <span className="text-[#9d8fb0]">—</span>
                    ),
            },
        ],
        [editBasePath],
    );

    const getSearchText = useCallback(
        (row: PurchaseDocumentListRow) =>
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

    const listToolbar = useMemo(
        () => (
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <ListTableFiltersToolbar className="min-w-0 flex-1">
                    <AdminListStatusFilter
                        value={serverFilters.paymentStatus ?? ''}
                        options={serverFilters.paymentStatusOptions}
                        onValueChange={serverFilters.onPaymentStatusChange}
                    />
                </ListTableFiltersToolbar>
                {dateRange ? (
                    <DateRangeFiltersToolbar
                        {...dateRange}
                        className="shrink-0"
                    />
                ) : null}
            </div>
        ),
        [dateRange, serverFilters],
    );

    const renderActions = useCallback(
        (row: PurchaseDocumentListRow) => {
            const payableRow = {
                ...row,
                document_edit_url: `${editBasePath}/${row.id}/edit`,
            } as PayableDocumentRow;
            const showHistory =
                onViewPaymentHistory &&
                hasPayablePaymentHistory(payableRow);

            return (
            <div className="flex items-center justify-end gap-1">
                {showHistory ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={purchaseTableIconBtnViolet}
                        onClick={() => onViewPaymentHistory(row)}
                        aria-label={`Historial de pagos ${row.internal_number}`}
                    >
                        <History className="size-4" />
                    </Button>
                ) : null}
                {abilities.canRecordPayment &&
                onRecordPayment &&
                row.can_receive_payment ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={purchaseTableIconBtnAmber}
                        onClick={() => onRecordPayment(row)}
                        aria-label={`Pagar ${row.internal_number}`}
                    >
                        <Banknote className="size-4" />
                    </Button>
                ) : null}
                {abilities.canUpdate ? (
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className={purchaseTableIconBtnViolet}
                    >
                        <Link
                            href={`${editBasePath}/${row.id}/edit`}
                            aria-label={`Editar ${row.internal_number}`}
                        >
                            <Pencil className="size-4" />
                        </Link>
                    </Button>
                ) : null}
            </div>
            );
        },
        [
            abilities.canRecordPayment,
            abilities.canUpdate,
            editBasePath,
            onRecordPayment,
            onViewPaymentHistory,
        ],
    );

    return (
        <DataTable
            data={rows}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar factura o proveedor…"
            emptyMessage="No hay facturas de compra en el periodo."
            emptyFilteredMessage="Ninguna factura coincide con tu búsqueda."
            defaultSort={{ columnId: 'dates', direction: 'desc' }}
            onFilteredCountChange={onFilteredCountChange}
            serverSearch={{
                value: serverFilters.search,
                onChange: serverFilters.onSearchChange,
                onCommit: () =>
                    serverFilters.onSearchCommit(serverFilters.search),
            }}
            toolbarEnd={listToolbar}
            renderActions={renderActions}
            actionsHeader=""
        />
    );
}
