import { Link } from '@inertiajs/react';
import { FileDown } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DateRangeFiltersToolbar } from '@/components/admin/date-range-filters-toolbar';
import { ListTableFiltersToolbar } from '@/components/admin/list-table-filters-toolbar';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
    treasuryAccountsTd,
    treasuryAccountsTh,
    treasuryColBalance,
    treasuryColInvoice,
    treasuryColMethod,
    treasuryColParty,
    treasuryColPaymentDate,
    treasuryColProof,
} from '@/lib/treasury-accounts-table-columns';
import { purchaseTableIconBtnViolet } from '@/lib/purchase-form-styles';
import { cn } from '@/lib/utils';
import type { DisbursementPaymentRow } from '@/types/admin/treasury';

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
    payments: DisbursementPaymentRow[];
    onFilteredCountChange?: (count: number) => void;
    serverSearch?: ServerSearchProps;
    dateRange?: DateRangeProps;
};

export function DisbursementPaymentsTable({
    payments,
    onFilteredCountChange,
    serverSearch,
    dateRange,
}: Props) {
    const columns = useMemo<DataTableColumn<DisbursementPaymentRow>[]>(
        () => [
            {
                id: 'date',
                header: 'Fecha',
                primary: true,
                sortable: true,
                sortValue: (row) => row.payment_date,
                headerClassName: cn(
                    treasuryAccountsTh,
                    treasuryColPaymentDate,
                    'whitespace-nowrap',
                ),
                cellClassName: cn(
                    treasuryAccountsTd,
                    'whitespace-nowrap font-semibold text-[#3b2d4a]',
                ),
                cell: (row) => row.payment_date_label,
            },
            {
                id: 'invoice',
                header: 'Factura',
                sortable: true,
                sortValue: (row) => row.purchase_document_number ?? '',
                headerClassName: cn(treasuryAccountsTh, treasuryColInvoice),
                cellClassName: treasuryAccountsTd,
                cell: (row) =>
                    row.purchase_document_id ? (
                        <Link
                            href={`/admin/compras/facturas/${row.purchase_document_id}/edit`}
                            className="block truncate font-mono text-[11px] font-semibold text-[#7c3aed] hover:underline"
                            title={row.purchase_document_number ?? undefined}
                        >
                            {row.purchase_document_number}
                        </Link>
                    ) : (
                        '—'
                    ),
            },
            {
                id: 'supplier',
                header: 'Proveedor',
                sortable: true,
                sortValue: (row) => row.party_name ?? '',
                truncate: true,
                headerClassName: cn(treasuryAccountsTh, treasuryColParty),
                cellClassName: cn(treasuryAccountsTd, 'min-w-0'),
                cell: (row) => (
                    <span
                        className="block truncate"
                        title={row.party_name ?? undefined}
                    >
                        {row.party_name ?? '—'}
                    </span>
                ),
            },
            {
                id: 'method',
                header: 'Método',
                sortable: true,
                sortValue: (row) => row.payment_method_name ?? '',
                headerClassName: cn(treasuryAccountsTh, treasuryColMethod),
                cellClassName: cn(treasuryAccountsTd, 'whitespace-nowrap'),
                cell: (row) => row.payment_method_name ?? '—',
            },
            {
                id: 'amount',
                header: 'Monto',
                sortable: true,
                sortValue: (row) => parseFloat(row.amount),
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
                    <span className="font-mono text-[11px] font-semibold tabular-nums text-[#4c1d95]">
                        {row.currency_code} {row.amount_label}
                    </span>
                ),
            },
            {
                id: 'proof',
                header: 'Adj.',
                sortable: false,
                headerClassName: cn(
                    treasuryAccountsTh,
                    treasuryColProof,
                    'text-center',
                ),
                cellClassName: cn(treasuryAccountsTd, 'text-center'),
                cell: (row) =>
                    row.proof_download_url ? (
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className={purchaseTableIconBtnViolet}
                        >
                            <a
                                href={row.proof_download_url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Ver comprobante de pago ${row.purchase_document_number ?? row.id}`}
                            >
                                <FileDown className="size-4" />
                            </a>
                        </Button>
                    ) : (
                        <span className="text-[#9d8fb0]">—</span>
                    ),
            },
        ],
        [],
    );

    const getSearchText = useCallback(
        (row: DisbursementPaymentRow) =>
            [
                row.purchase_document_number,
                row.party_name,
                row.reference,
                row.payment_method_name,
            ]
                .filter(Boolean)
                .join(' '),
        [],
    );

    const listToolbar = useMemo(
        () =>
            dateRange ? (
                <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                    {serverSearch ? (
                        <ListTableFiltersToolbar className="min-w-0 flex-1" />
                    ) : null}
                    <DateRangeFiltersToolbar {...dateRange} className="shrink-0" />
                </div>
            ) : null,
        [dateRange, serverSearch],
    );

    return (
        <DataTable
            data={payments}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar pago, factura o proveedor…"
            emptyMessage="No hay pagos a proveedores en el periodo."
            emptyFilteredMessage="Ningún pago coincide con tu búsqueda."
            defaultSort={{ columnId: 'date', direction: 'desc' }}
            onFilteredCountChange={onFilteredCountChange}
            serverSearch={
                serverSearch
                    ? {
                          value: serverSearch.value,
                          onChange: serverSearch.onChange,
                          onCommit: serverSearch.onCommit,
                      }
                    : undefined
            }
            toolbarEnd={listToolbar}
            className="min-w-0 [&_table]:table-fixed"
        />
    );
}
