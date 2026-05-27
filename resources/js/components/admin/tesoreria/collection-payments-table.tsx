import { Link } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { edit } from '@/routes/admin/ventas/comprobantes';
import { CollectionsFiltersToolbar } from '@/components/admin/tesoreria/collections-filters-toolbar';
import {
    treasuryAccountsTd,
    treasuryAccountsTh,
    treasuryColBalance,
    treasuryColInvoice,
    treasuryColMethod,
    treasuryColParty,
    treasuryColPaymentDate,
    treasuryColReference,
} from '@/lib/treasury-accounts-table-columns';
import { cn } from '@/lib/utils';
import type { CollectionPaymentRow } from '@/types/admin/treasury';

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
    payments: CollectionPaymentRow[];
    onFilteredCountChange?: (count: number) => void;
    serverSearch?: ServerSearchProps;
    dateRange?: DateRangeProps;
};

export function CollectionPaymentsTable({
    payments,
    onFilteredCountChange,
    serverSearch,
    dateRange,
}: Props) {
    const columns = useMemo<DataTableColumn<CollectionPaymentRow>[]>(
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
                id: 'document',
                header: 'Comprobante',
                sortable: true,
                sortValue: (row) => row.sales_document_number ?? '',
                headerClassName: cn(treasuryAccountsTh, treasuryColInvoice),
                cellClassName: treasuryAccountsTd,
                cell: (row) =>
                    row.sales_document_id && row.sales_document_number ? (
                        <Link
                            href={edit.url(row.sales_document_id)}
                            className="font-mono text-[#7c3aed] hover:underline"
                        >
                            {row.sales_document_number}
                        </Link>
                    ) : (
                        '—'
                    ),
            },
            {
                id: 'party',
                header: 'Cliente',
                sortable: true,
                sortValue: (row) => row.party_name ?? '',
                truncate: true,
                headerClassName: cn(treasuryAccountsTh, treasuryColParty),
                cellClassName: cn(treasuryAccountsTd, 'min-w-0'),
                cell: (row) => (
                    <span
                        className="block min-w-0"
                        title={
                            row.party_document
                                ? `${row.party_name ?? ''} · ${row.party_document}`
                                : row.party_name ?? undefined
                        }
                    >
                        <span className="block truncate">
                            {row.party_name ?? '—'}
                        </span>
                        {row.party_document ? (
                            <span className="mt-0.5 block truncate text-[10px] font-normal text-[#6b5b7a]">
                                {row.party_document}
                            </span>
                        ) : null}
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
                id: 'reference',
                header: 'Referencia',
                sortable: true,
                sortValue: (row) => row.reference ?? '',
                truncate: true,
                headerClassName: cn(treasuryAccountsTh, treasuryColReference),
                cellClassName: cn(
                    treasuryAccountsTd,
                    'min-w-0 text-[#7c6f8a]',
                ),
                cell: (row) => row.reference ?? '—',
            },
            {
                id: 'amount',
                header: 'Monto',
                align: 'right',
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
        ],
        [],
    );

    const getSearchText = useCallback(
        (row: CollectionPaymentRow) =>
            [
                row.sales_document_number,
                row.party_name,
                row.party_document,
                row.payment_method_name,
                row.reference,
                row.created_by_name,
            ]
                .filter(Boolean)
                .join(' '),
        [],
    );

    return (
        <DataTable
            data={payments}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar por comprobante, cliente o referencia…"
            emptyMessage="No hay cobros registrados."
            emptyFilteredMessage="Ningún cobro coincide con tu búsqueda."
            defaultSort={{ columnId: 'date', direction: 'desc' }}
            onFilteredCountChange={onFilteredCountChange}
            serverSearch={serverSearch}
            toolbarEnd={
                dateRange ? (
                    <CollectionsFiltersToolbar
                        from={dateRange.from}
                        to={dateRange.to}
                        onFromChange={dateRange.onFromChange}
                        onToChange={dateRange.onToChange}
                        onRangeCommit={dateRange.onRangeCommit}
                    />
                ) : undefined
            }
            className="min-w-0 [&_table]:table-fixed"
        />
    );
}
