import { Head, router } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ElectronicDocumentsTable } from '@/components/admin/documentos/electronic-documents-table';
import {
    PageHeader,
    PageHeaderBadges,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { documentosComprobantesElectronicosIndex } from '@/lib/admin-breadcrumbs';
import { index as cpeIndex } from '@/routes/admin/documentos/comprobantes-electronicos';
import type { ElectronicDocumentsIndexPageProps } from '@/types/admin/electronic-documents';

export default function ElectronicDocumentsIndex({
    documents = [],
    filters,
    statusOptions,
    stats = [],
}: ElectronicDocumentsIndexPageProps) {
    const [filteredCount, setFilteredCount] = useState(documents.length);
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const applyFilters = useCallback(
        (patch: { status?: string; search?: string }) => {
            router.get(
                cpeIndex.url({
                    query: {
                        status: patch.status ?? filters.status ?? undefined,
                        search:
                            patch.search !== undefined
                                ? patch.search
                                : search || undefined,
                    },
                }),
                {},
                { preserveState: true, replace: true },
            );
        },
        [filters.status, search],
    );

    const serverFilters = useMemo(
        () => ({
            search,
            status: filters.status,
            statusOptions,
            onSearchChange: setSearch,
            onSearchCommit: (value) =>
                applyFilters({ search: (value ?? search).trim() }),
            onStatusChange: (status: string) => applyFilters({ status }),
        }),
        [search, filters.status, statusOptions, applyFilters],
    );

    const showFilteredBadge = filteredCount !== documents.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Comprobantes electrónicos" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Comprobantes electrónicos"
                        description="Estado de emisión SUNAT (CPE) vinculados a comprobantes de venta confirmados."
                    />
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

            <ElectronicDocumentsTable
                rows={documents}
                serverFilters={serverFilters}
                onFilteredCountChange={setFilteredCount}
            />
        </div>
    );
}

ElectronicDocumentsIndex.layout = {
    breadcrumbs: documentosComprobantesElectronicosIndex(),
};
