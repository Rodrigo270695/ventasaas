import { Head, Link, router } from '@inertiajs/react';
import { Check, CloudOff, Copy, Eye, FileText, Mail, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OfflineQuotationEditDialog } from '@/components/offline/offline-quotation-edit-dialog';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { AdminListStatusFilter } from '@/components/admin/admin-list-status-filter';
import { ListTableFiltersToolbar } from '@/components/admin/list-table-filters-toolbar';
import {
    PageHeader,
    PageHeaderActions,
    PageHeaderBadges,
    PageHeaderNewButton,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { useOfflineQuotationsIndex } from '@/hooks/use-offline-quotations-index';
import { ventasCotizacionesIndex } from '@/lib/admin-breadcrumbs';
import { SALES_QUOTATIONS_PERMISSIONS } from '@/lib/admin-permissions';
import { isOfflineEntityId } from '@/lib/offline-store';
import { isOfflineEntityId } from '@/lib/offline-store';
import type { SalesQuotationIndexPageProps, SalesQuotationListRow } from '@/types/admin/sales-quotations';

const INDEX_URL = '/admin/ventas/cotizaciones';

export default function SalesQuotationsIndex({
    quotations: serverQuotations = [],
    filters,
    statusOptions = [],
    stats: serverStats = [],
}: SalesQuotationIndexPageProps) {
    const { can } = useCan();
    const [status, setStatus] = useState(filters.status ?? '');

    const { quotations, stats, isOffline, pendingCount, refreshFromCache } =
        useOfflineQuotationsIndex({
            serverQuotations,
            serverStats,
        });

    const [offlineEditId, setOfflineEditId] = useState<string | null>(null);

    const columns = useMemo<DataTableColumn<SalesQuotationListRow>[]>(
        () => [
            {
                id: 'number',
                header: 'Cotización',
                primary: true,
                sortable: true,
                sortValue: (row) => row.internal_number,
                cell: (row) => (
                    <div>
                        <span className="font-mono font-semibold text-[#7c3aed]">{row.internal_number}</span>
                        {row.is_email_sent ? (
                            <div className="mt-1 text-[10px] font-semibold text-cyan-700">Correo enviado</div>
                        ) : null}
                    </div>
                ),
            },
            {
                id: 'customer',
                header: 'Cliente',
                sortable: true,
                sortValue: (row) => row.customer_name,
                cell: (row) => row.customer_name,
            },
            {
                id: 'date',
                header: 'Fecha',
                sortable: true,
                sortValue: (row) => row.issue_date,
                cell: (row) => row.issue_date_label ?? '—',
            },
            {
                id: 'status',
                header: 'Estado',
                sortable: true,
                sortValue: (row) => row.status_label,
                cell: (row) => (
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-[#5b21b6]">
                        {row.status_label}
                    </span>
                ),
            },
            {
                id: 'total',
                header: 'Total',
                sortable: true,
                sortValue: (row) => row.total_label,
                cell: (row) => (
                    <span className="font-semibold tabular-nums">
                        {row.currency_code} {row.total_label}
                    </span>
                ),
            },
        ],
        [],
    );

    return (
        <div className="flex flex-1 flex-col gap-3 p-4 md:p-6">
            <Head title="Cotizaciones" />

            <PageHeader className="mb-0 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Cotizaciones"
                        description={
                            isOffline
                                ? 'Sin internet: listado en caché. Puedes crear borradores; acciones avanzadas requieren conexión.'
                                : 'Propuestas comerciales para clientes. Puedes incluir líneas manuales fuera de inventario.'
                        }
                    />
                    <PageHeaderActions>
                        {can(SALES_QUOTATIONS_PERMISSIONS.CREATE) ? (
                            <PageHeaderNewButton href={`${INDEX_URL}/nuevo`} label="Nueva cotización" />
                        ) : null}
                    </PageHeaderActions>
                </PageHeaderTop>
                <PageHeaderBadges>
                    {isOffline ? (
                        <Badge
                            variant="outline"
                            className="gap-1 border-amber-300 bg-amber-50 text-amber-900"
                        >
                            <CloudOff className="size-3" />
                            Modo offline
                        </Badge>
                    ) : null}
                    {pendingCount > 0 ? (
                        <Badge
                            variant="outline"
                            className="border-violet-300 bg-violet-50 text-violet-900"
                        >
                            {pendingCount} pendiente
                            {pendingCount === 1 ? '' : 's'} de sync
                        </Badge>
                    ) : null}
                    {stats.map((s) => (
                        <StatBadge key={s.key} label={s.label} value={String(s.value)} tone={s.tone as 'violet'} />
                    ))}
                </PageHeaderBadges>
            </PageHeader>

            <DataTable
                data={quotations}
                columns={columns}
                getRowKey={(r) => r.id}
                getSearchText={(r) => `${r.internal_number} ${r.customer_name} ${r.status_label}`}
                searchPlaceholder="Buscar cotización o cliente…"
                emptyMessage="No hay cotizaciones."
                defaultSort={{ columnId: 'date', direction: 'desc' }}
                actionsHeader=""
                toolbarEnd={
                    <ListTableFiltersToolbar>
                        <AdminListStatusFilter
                            value={status}
                            options={statusOptions}
                            onValueChange={(value) => {
                                setStatus(value);

                                if (isOffline) {
                                    return;
                                }

                                router.get(
                                    INDEX_URL,
                                    { ...filters, status: value || undefined },
                                    { preserveState: true, replace: true },
                                );
                            }}
                            placeholder="Todos los estados"
                        />
                    </ListTableFiltersToolbar>
                }
                renderActions={(row) => (
                    <div className="flex items-center justify-end gap-1">
                        <Button
                            asChild={!isOffline || !isOfflineEntityId(row.id)}
                            variant="ghost"
                            size="icon"
                            className="size-8 cursor-pointer rounded-lg text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white"
                            onClick={
                                isOffline && isOfflineEntityId(row.id)
                                    ? () => setOfflineEditId(row.id)
                                    : undefined
                            }
                        >
                            {isOffline && isOfflineEntityId(row.id) ? (
                                <Eye className="size-4" />
                            ) : (
                                <Link
                                    href={`${INDEX_URL}/${row.id}/edit`}
                                    aria-label={`Editar ${row.internal_number}`}
                                >
                                    <Eye className="size-4" />
                                </Link>
                            )}
                        </Button>
                        {!isOffline ? (
                            <>
                                <Button asChild variant="ghost" size="icon" className="size-8 cursor-pointer rounded-lg text-slate-700 hover:bg-slate-700 hover:text-white">
                                    <a
                                        href={`${INDEX_URL}/${row.id}/imprimir`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Ver PDF ${row.internal_number}`}
                                    >
                                        <FileText className="size-4" />
                                    </a>
                                </Button>
                                {row.is_email_sent ? (
                                    <span className="inline-flex size-8 items-center justify-center text-cyan-700">
                                        <Mail className="size-4" />
                                    </span>
                                ) : null}
                                {!row.sales_document_id ? (
                                    <>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 cursor-pointer rounded-lg text-emerald-700 hover:bg-emerald-600 hover:text-white"
                                            onClick={() => router.post(`${INDEX_URL}/${row.id}/aceptar`, {}, { preserveScroll: true })}
                                            aria-label={`Aceptar ${row.internal_number}`}
                                        >
                                            <Check className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 cursor-pointer rounded-lg text-amber-700 hover:bg-amber-600 hover:text-white"
                                            onClick={() => router.post(`${INDEX_URL}/${row.id}/rechazar`, {}, { preserveScroll: true })}
                                            aria-label={`Rechazar ${row.internal_number}`}
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </>
                                ) : null}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 cursor-pointer rounded-lg text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white"
                                    onClick={() => router.post(`${INDEX_URL}/${row.id}/duplicar`, {}, { preserveScroll: true })}
                                    aria-label={`Duplicar ${row.internal_number}`}
                                >
                                    <Copy className="size-4" />
                                </Button>
                            </>
                        ) : null}
                    </div>
                )}
            />

            <OfflineQuotationEditDialog
                quotationId={offlineEditId}
                onClose={() => setOfflineEditId(null)}
                onSaved={refreshFromCache}
            />
        </div>
    );
}

SalesQuotationsIndex.layout = () => ({
    breadcrumbs: ventasCotizacionesIndex(),
});

