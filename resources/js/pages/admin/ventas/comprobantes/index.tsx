import { Head, router, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CollectionPaymentModal } from '@/components/admin/ventas/collection-payment-modal';
import { SalesDocumentsTable } from '@/components/admin/ventas/sales-documents-table';
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
import {
    ventasComprobantesIndex,
    ventasTicketsInternosIndex,
} from '@/lib/admin-breadcrumbs';
import {
    SALES_INTERNAL_PERMISSIONS,
    SALES_PERMISSIONS,
} from '@/lib/admin-permissions';
import { getCurrentWeekDateRange } from '@/lib/sales-documents-date-range';
import { index as comprobantesIndex } from '@/routes/admin/ventas/comprobantes';
import { index as ticketsInternosIndex } from '@/routes/admin/ventas/tickets-internos';
import type {
    SalesDocumentListRow,
    SalesDocumentsIndexPageProps,
    SalesSaleMode,
} from '@/types/admin/sales-documents';

const STATUS_OPTIONS = [
    { value: '', label: 'Todos los estados' },
    { value: 'draft', label: 'Borrador' },
    { value: 'confirmed', label: 'Confirmado' },
];

const defaultWeek = getCurrentWeekDateRange();

function salesListPaths(saleMode: SalesSaleMode) {
    const internal = saleMode === 'internal';

    return {
        indexRoute: internal ? ticketsInternosIndex : comprobantesIndex,
        base: internal
            ? '/admin/ventas/tickets-internos'
            : '/admin/ventas/comprobantes',
        newLabel: internal ? 'Nueva venta rápida' : 'Nuevo comprobante',
        canCreate: internal
            ? SALES_INTERNAL_PERMISSIONS.CREATE
            : SALES_PERMISSIONS.CREATE,
    };
}

type PageProps = SalesDocumentsIndexPageProps & {
    errors?: Record<string, string>;
};

export default function SalesDocumentsIndex({
    saleMode = 'fiscal',
    documents = [],
    paymentMethods = [],
    canRecordPayment = false,
    openCashSession = null,
    filters,
    stats = [],
}: SalesDocumentsIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();
    const paths = salesListPaths(saleMode);
    const isInternal = saleMode === 'internal';
    const [filteredCount, setFilteredCount] = useState(documents.length);
    const [search, setSearch] = useState(filters.search ?? '');
    const [from, setFrom] = useState(filters.from ?? defaultWeek.from);
    const [to, setTo] = useState(filters.to ?? defaultWeek.to);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentDocument, setPaymentDocument] =
        useState<SalesDocumentListRow | null>(null);

    useEffect(() => {
        setSearch(filters.search ?? '');
        setFrom(filters.from ?? defaultWeek.from);
        setTo(filters.to ?? defaultWeek.to);
    }, [filters.search, filters.from, filters.to]);

    const tableAbilities = useMemo(
        () => ({
            canUpdate: isInternal
                ? can(SALES_INTERNAL_PERMISSIONS.UPDATE) ||
                  can(SALES_PERMISSIONS.UPDATE)
                : can(SALES_PERMISSIONS.UPDATE),
            canRecordPayment: canRecordPayment,
        }),
        [can, canRecordPayment, isInternal],
    );

    const handleRecordPayment = useCallback((row: SalesDocumentListRow) => {
        setPaymentDocument(row);
        setPaymentModalOpen(true);
    }, []);

    const visitWithFilters = useCallback(
        (patch: {
            status?: string;
            search?: string;
            from?: string;
            to?: string;
        }) => {
            const nextStatus =
                patch.status !== undefined ? patch.status : (filters.status ?? '');
            const nextSearch =
                patch.search !== undefined ? patch.search : search;
            const nextFrom = patch.from !== undefined ? patch.from : from;
            const nextTo = patch.to !== undefined ? patch.to : to;

            router.get(
                paths.indexRoute.url({
                    query: {
                        status: nextStatus || undefined,
                        search: nextSearch || undefined,
                        from: nextFrom || undefined,
                        to: nextTo || undefined,
                    },
                }),
                {},
                { preserveState: true, replace: true },
            );
        },
        [filters.status, search, from, to, paths.indexRoute],
    );

    const handleRangeCommit = useCallback(() => {
        visitWithFilters({ from, to });
    }, [visitWithFilters, from, to]);

    const serverFilters = useMemo(
        () => ({
            search,
            status: filters.status,
            statusOptions: STATUS_OPTIONS,
            onSearchChange: setSearch,
            onSearchCommit: (value) =>
                visitWithFilters({ search: (value ?? search).trim() }),
            onStatusChange: (status: string) => visitWithFilters({ status }),
        }),
        [search, filters.status, visitWithFilters],
    );

    const dateRange = useMemo(
        () => ({
            from,
            to,
            onFromChange: setFrom,
            onToChange: setTo,
            onRangeCommit: handleRangeCommit,
        }),
        [from, to, handleRangeCommit],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const showFilteredBadge = filteredCount !== documents.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head
                title={
                    isInternal ? 'Venta rápida' : 'Comprobantes de venta'
                }
            />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title={
                            isInternal
                                ? 'Venta rápida'
                                : 'Comprobantes de venta'
                        }
                        description={
                            isInternal
                                ? 'Tickets internos sin CPE. Cliente opcional; no válidos como comprobante de pago.'
                                : 'Facturas y boletas. Los borradores se numeran al confirmar.'
                        }
                    />
                    <PageHeaderActions>
                        {can(paths.canCreate) && (
                            <PageHeaderNewButton
                                href={`${paths.base}/nuevo`}
                                label={paths.newLabel}
                            />
                        )}
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

            <SalesDocumentsTable
                rows={documents}
                abilities={tableAbilities}
                serverFilters={serverFilters}
                editBasePath={paths.base}
                isInternal={isInternal}
                onRecordPayment={handleRecordPayment}
                onFilteredCountChange={handleFilteredCountChange}
                dateRange={dateRange}
            />

            {canRecordPayment && paymentMethods.length > 0 ? (
                <CollectionPaymentModal
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
                    saleMode={saleMode}
                    errors={errors}
                />
            ) : null}
        </div>
    );
}

SalesDocumentsIndex.layout = (props: SalesDocumentsIndexPageProps) => ({
    breadcrumbs:
        props.saleMode === 'internal'
            ? ventasTicketsInternosIndex()
            : ventasComprobantesIndex(),
});
