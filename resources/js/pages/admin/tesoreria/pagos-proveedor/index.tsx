import { Head, router } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DisbursementPaymentsTable } from '@/components/admin/tesoreria/disbursement-payments-table';
import {
    PageHeader,
    PageHeaderBadges,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { tesoreriaPagosProveedorIndex } from '@/lib/admin-breadcrumbs';
import { getCurrentMonthDateRange } from '@/lib/collections-date-range';
import type { DisbursementPaymentRow } from '@/types/admin/treasury';

const INDEX_URL = '/admin/tesoreria/pagos-proveedor';
const defaultMonth = getCurrentMonthDateRange();

type PageProps = {
    payments: DisbursementPaymentRow[];
    filters: {
        search: string;
        from: string | null;
        to: string | null;
    };
    stats: Array<{
        key: string;
        label: string;
        value: string | number;
        tone: string;
    }>;
};

export default function DisbursementPaymentsIndex({
    payments = [],
    filters,
    stats = [],
}: PageProps) {
    const [filteredCount, setFilteredCount] = useState(payments.length);
    const [search, setSearch] = useState(filters.search ?? '');
    const [from, setFrom] = useState(filters.from ?? defaultMonth.from);
    const [to, setTo] = useState(filters.to ?? defaultMonth.to);

    useEffect(() => {
        setSearch(filters.search ?? '');
        setFrom(filters.from ?? defaultMonth.from);
        setTo(filters.to ?? defaultMonth.to);
    }, [filters.search, filters.from, filters.to]);

    const visitWithFilters = useCallback(
        (patch: { search?: string; from?: string; to?: string }) => {
            router.get(
                INDEX_URL,
                {
                    search:
                        (patch.search !== undefined ? patch.search : search) ||
                        undefined,
                    from:
                        (patch.from !== undefined ? patch.from : from) ||
                        undefined,
                    to: (patch.to !== undefined ? patch.to : to) || undefined,
                },
                { preserveState: true, replace: true },
            );
        },
        [search, from, to],
    );

    const statBadges = useMemo(
        () =>
            stats.map((stat) => (
                <StatBadge
                    key={stat.key}
                    label={stat.label}
                    value={String(stat.value)}
                    tone={stat.tone as 'violet'}
                />
            )),
        [stats],
    );

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Pagos a proveedores" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Pagos a proveedores"
                        description="Historial de desembolsos. Cada pago puede incluir comprobante de transferencia o voucher."
                    />
                </PageHeaderTop>
                <PageHeaderBadges>
                    {statBadges}
                    {filteredCount !== payments.length ? (
                        <StatBadge
                            label="Resultados"
                            value={String(filteredCount)}
                            tone="pink"
                            icon={ListFilter}
                        />
                    ) : null}
                </PageHeaderBadges>
            </PageHeader>

            <DisbursementPaymentsTable
                payments={payments}
                onFilteredCountChange={setFilteredCount}
                serverSearch={{
                    value: search,
                    onChange: setSearch,
                    onCommit: () => visitWithFilters({ search }),
                }}
                dateRange={{
                    from,
                    to,
                    onFromChange: setFrom,
                    onToChange: setTo,
                    onRangeCommit: () => visitWithFilters({ from, to }),
                }}
            />
        </div>
    );
}

DisbursementPaymentsIndex.layout = () => ({
    breadcrumbs: tesoreriaPagosProveedorIndex(),
});
