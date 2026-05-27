import { Eye } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import {
    AdminListStatusFilter,
    type AdminListStatusOption,
} from '@/components/admin/admin-list-status-filter';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { show as cpeShow } from '@/routes/admin/documentos/comprobantes-electronicos';
import type { ElectronicDocumentListRow } from '@/types/admin/electronic-documents';

export type ElectronicDocumentsServerFilters = {
    search: string;
    status: string | null | undefined;
    statusOptions: AdminListStatusOption[];
    onSearchChange: (value: string) => void;
    onSearchCommit: (value?: string) => void;
    onStatusChange: (status: string) => void;
};

type Props = {
    rows: ElectronicDocumentListRow[];
    serverFilters: ElectronicDocumentsServerFilters;
    onFilteredCountChange?: (count: number) => void;
};

function CpeStatusBadge({
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
                status === 'accepted' &&
                    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
                (status === 'pending' || status === 'building') &&
                    'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
                status === 'sent' &&
                    'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80',
                status === 'rejected' &&
                    'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80',
                status === 'observed' &&
                    'bg-orange-50 text-orange-800 ring-1 ring-orange-200/80',
                status === 'cancelled' &&
                    'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
            )}
        >
            {label}
        </span>
    );
}

export function ElectronicDocumentsTable({
    rows,
    serverFilters,
    onFilteredCountChange,
}: Props) {
    const statusToolbar = useMemo(
        () => (
            <AdminListStatusFilter
                id="electronic-documents-status"
                value={serverFilters.status}
                options={serverFilters.statusOptions}
                onValueChange={serverFilters.onStatusChange}
                placeholder="Estado CPE…"
                aria-label="Filtrar por estado CPE"
            />
        ),
        [
            serverFilters.status,
            serverFilters.statusOptions,
            serverFilters.onStatusChange,
        ],
    );
    const columns = useMemo<DataTableColumn<ElectronicDocumentListRow>[]>(
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
                            {row.document_type_label}
                            {row.series ? ` · ${row.series}` : null}
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
                sortValue: (row) => row.issue_date ?? '',
                headerClassName: 'w-[8.75rem] whitespace-nowrap',
                cellClassName: 'whitespace-nowrap',
                cell: (row) => row.issue_date_label ?? '—',
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
                        <span className="block truncate">{row.customer_name ?? '—'}</span>
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
                header: 'Estado CPE',
                sortable: true,
                sortValue: (row) => row.status,
                headerClassName: 'w-[14rem]',
                cellClassName: 'min-w-0',
                cell: (row) => (
                    <span className="block min-w-0">
                        <CpeStatusBadge
                            status={row.status}
                            label={row.status_label}
                        />
                        {row.sunat_description ? (
                            <span className="mt-1 line-clamp-2 block max-w-[220px] text-xs font-normal text-[#6b5b7a]">
                                {row.sunat_description}
                            </span>
                        ) : null}
                    </span>
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
        (row: ElectronicDocumentListRow) =>
            [
                row.full_number,
                row.customer_name,
                row.customer_document,
                row.document_type_label,
                row.status_label,
                row.sunat_description,
                row.sunat_response_code,
            ]
                .filter(Boolean)
                .join(' '),
        [],
    );

    const renderActions = useCallback(
        (row: ElectronicDocumentListRow) => (
            <Button
                variant="ghost"
                size="icon"
                className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                asChild
            >
                <Link
                    href={cpeShow.url(row.id)}
                    aria-label={`Ver CPE ${row.full_number}`}
                >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver detalle CPE</span>
                </Link>
            </Button>
        ),
        [],
    );

    return (
        <DataTable
            data={rows}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar número, cliente o SUNAT…"
            emptyMessage="No hay comprobantes electrónicos."
            emptyFilteredMessage="Ningún CPE coincide con tu búsqueda."
            defaultSort={{ columnId: 'date', direction: 'desc' }}
            renderActions={renderActions}
            actionsHeader="Acciones"
            onFilteredCountChange={onFilteredCountChange}
            toolbarEnd={statusToolbar}
            className="min-w-0 [&_table]:table-fixed"
            serverSearch={{
                value: serverFilters.search,
                onChange: serverFilters.onSearchChange,
                onCommit: serverFilters.onSearchCommit,
                placeholder:
                    'Buscar número, cliente o respuesta SUNAT…',
            }}
        />
    );
}
