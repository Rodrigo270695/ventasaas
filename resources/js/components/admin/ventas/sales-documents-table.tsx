import { Banknote, Eye, Pencil } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { SalesDocumentListRow } from '@/types/admin/sales-documents';

export type SalesDocumentsTableAbilities = {
    canUpdate: boolean;
    canRecordPayment?: boolean;
};

export type SalesDocumentsServerFilters = {
    search: string;
    status: string | null | undefined;
    statusOptions: AdminListStatusOption[];
    onSearchChange: (value: string) => void;
    onSearchCommit: (value?: string) => void;
    onStatusChange: (status: string) => void;
};

type DateRangeProps = {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    onRangeCommit: () => void;
};

type Props = {
    rows: SalesDocumentListRow[];
    abilities: SalesDocumentsTableAbilities;
    serverFilters: SalesDocumentsServerFilters;
    editBasePath?: string;
    isInternal?: boolean;
    onRecordPayment?: (row: SalesDocumentListRow) => void;
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

function StatusBadge({ status, label }: { status: string; label: string }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                status === 'confirmed' &&
                    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
                status === 'draft' &&
                    'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
                status === 'voided' &&
                    'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
            )}
        >
            {label}
        </span>
    );
}

export function SalesDocumentsTable({
    rows,
    abilities,
    serverFilters,
    editBasePath = '/admin/ventas/comprobantes',
    isInternal = false,
    onRecordPayment,
    onFilteredCountChange,
    dateRange,
}: Props) {
    const listToolbar = useMemo(
        () => (
            <ListTableFiltersToolbar>
                {dateRange ? (
                    <DateRangeFiltersToolbar
                        idPrefix={
                            isInternal
                                ? 'sales-tickets'
                                : 'sales-documents'
                        }
                        {...dateRange}
                    />
                ) : null}
                <AdminListStatusFilter
                    id="sales-documents-status"
                    value={serverFilters.status}
                    options={serverFilters.statusOptions}
                    onValueChange={serverFilters.onStatusChange}
                    placeholder="Todos los estados"
                    className="w-full sm:w-46"
                />
            </ListTableFiltersToolbar>
        ),
        [dateRange, isInternal, serverFilters],
    );
    const columns = useMemo<DataTableColumn<SalesDocumentListRow>[]>(
        () => [
            {
                id: 'number',
                header: 'Comprobante',
                primary: true,
                sortable: true,
                sortValue: (row) => row.full_number,
                cell: (row) => (
                    <span>
                        <span className="font-mono">{row.full_number}</span>
                        <span className="mt-0.5 block text-xs font-normal text-[#6b5b7a]">
                            {row.document_type_label} · {row.series}
                        </span>
                    </span>
                ),
                headerClassName: 'w-[10.5rem]',
                cellClassName: 'font-semibold text-[#3b2d4a]',
            },
            {
                id: 'date',
                header: 'Emisión',
                mobileLabel: 'Fecha',
                sortable: true,
                sortValue: (row) => row.issue_date,
                headerClassName: 'w-[8.75rem] whitespace-nowrap',
                cellClassName: 'whitespace-nowrap',
                cell: (row) => row.issue_date_label,
            },
            {
                id: 'customer',
                header: 'Cliente',
                sortable: true,
                sortValue: (row) => row.customer_name ?? '',
                headerClassName: 'w-[15rem]',
                cellClassName: 'min-w-0',
                cell: (row) => (
                    <span className="block min-w-0" title={row.customer_name ?? undefined}>
                        <span className="block truncate">
                            {row.customer_name ?? (
                                <span className="text-[#9d8fb0] italic">
                                    Sin cliente
                                </span>
                            )}
                        </span>
                        {row.customer_document ? (
                            <span className="mt-0.5 block truncate text-xs font-normal text-[#6b5b7a]">
                                {row.customer_document}
                            </span>
                        ) : null}
                    </span>
                ),
            },
            {
                id: 'status',
                header: 'Estado',
                sortable: true,
                sortValue: (row) => row.status,
                headerClassName: 'w-[7.25rem] whitespace-nowrap',
                cellClassName: 'whitespace-nowrap',
                cell: (row) => (
                    <StatusBadge status={row.status} label={row.status_label} />
                ),
            },
            {
                id: 'payment',
                header: 'Cobro',
                sortable: true,
                sortValue: (row) => row.payment_status ?? '',
                headerClassName: 'w-[9rem]',
                cellClassName: 'whitespace-nowrap',
                cell: (row) =>
                    row.payment_status_label ? (
                        <span>
                            <PaymentStatusBadge
                                status={row.payment_status ?? 'unpaid'}
                                label={row.payment_status_label}
                            />
                            {row.balance_due &&
                            parseFloat(row.balance_due) > 0 ? (
                                <span className="mt-0.5 block text-xs font-normal text-[#6b5b7a]">
                                    Saldo: {row.currency_code}{' '}
                                    {row.balance_due_label}
                                </span>
                            ) : null}
                        </span>
                    ) : (
                        '—'
                    ),
            },
            {
                id: 'total',
                header: 'Total',
                align: 'right',
                sortable: true,
                sortValue: (row) => parseFloat(row.total),
                headerClassName: 'w-[7rem] text-right',
                cellClassName: 'whitespace-nowrap',
                cell: (row) => (
                    <span className="font-mono text-sm font-semibold text-[#4c1d95]">
                        {row.currency_code} {row.total_label}
                    </span>
                ),
            },
        ],
        [],
    );

    const getSearchText = useCallback(
        (row: SalesDocumentListRow) =>
            [
                row.full_number,
                row.customer_name,
                row.customer_document,
                row.document_type_label,
                row.series,
                row.status_label,
            ]
                .filter(Boolean)
                .join(' '),
        [],
    );

    const renderActions = useCallback(
        (row: SalesDocumentListRow) => (
            <>
                {abilities.canRecordPayment &&
                row.can_receive_payment &&
                onRecordPayment ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg text-emerald-600 transition-all duration-200 hover:bg-emerald-600 hover:text-white hover:shadow-md hover:shadow-emerald-300/40 active:scale-95"
                        onClick={() => onRecordPayment(row)}
                        aria-label={`Registrar cobro ${row.full_number}`}
                    >
                        <Banknote className="size-4" />
                    </Button>
                ) : null}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                    asChild
                >
                    <Link
                        href={`${editBasePath}/${row.id}/edit`}
                        aria-label={
                            abilities.canUpdate && row.status === 'draft'
                                ? `Editar ${row.full_number}`
                                : `Ver ${row.full_number}`
                        }
                    >
                        {abilities.canUpdate && row.status === 'draft' ? (
                            <Pencil className="size-4" />
                        ) : (
                            <Eye className="size-4" />
                        )}
                    </Link>
                </Button>
            </>
        ),
        [
            abilities.canUpdate,
            abilities.canRecordPayment,
            editBasePath,
            onRecordPayment,
        ],
    );

    return (
        <DataTable
            data={rows}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar por número o cliente…"
            emptyMessage={
                isInternal
                    ? 'No hay tickets internos.'
                    : 'No hay comprobantes de venta.'
            }
            emptyFilteredMessage={
                isInternal
                    ? 'Ningún ticket coincide con tu búsqueda.'
                    : 'Ningún comprobante coincide con tu búsqueda.'
            }
            defaultSort={{ columnId: 'date', direction: 'desc' }}
            renderActions={renderActions}
            actionsHeader="Acciones"
            onFilteredCountChange={onFilteredCountChange}
            toolbarEnd={listToolbar}
            className="min-w-0 [&_table]:table-fixed"
            serverSearch={{
                value: serverFilters.search,
                onChange: serverFilters.onSearchChange,
                onCommit: serverFilters.onSearchCommit,
                placeholder: 'Buscar por número o cliente…',
            }}
        />
    );
}
