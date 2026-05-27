import { Head, router } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CollectionPaymentsTable } from '@/components/admin/tesoreria/collection-payments-table';
import {
    PageHeader,
    PageHeaderBadges,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { index as collectionsIndex } from '@/routes/admin/tesoreria/cobros';
import { tesoreriaCobrosIndex } from '@/lib/admin-breadcrumbs';
import {
    getCurrentMonthDateRange,
    getTodayDateString,
} from '@/lib/collections-date-range';
import { COLLECTIONS_STAT_ICONS } from '@/lib/treasury-collections-stat-icons';
import type {
    CollectionStatItem,
    CollectionsIndexPageProps,
    CollectionsPeriodFilter,
} from '@/types/admin/treasury';

const defaultMonth = getCurrentMonthDateRange();

export default function CollectionsIndex({
    payments = [],
    filters,
    stats = [],
}: CollectionsIndexPageProps) {
    const [filteredCount, setFilteredCount] = useState(payments.length);
    const [search, setSearch] = useState(filters.search ?? '');
    const [from, setFrom] = useState(filters.from ?? defaultMonth.from);
    const [to, setTo] = useState(filters.to ?? defaultMonth.to);
    const [period, setPeriod] = useState<CollectionsPeriodFilter | null>(
        filters.period ?? 'month',
    );

    useEffect(() => {
        setSearch(filters.search ?? '');
        setFrom(filters.from ?? defaultMonth.from);
        setTo(filters.to ?? defaultMonth.to);
        setPeriod(filters.period ?? null);
    }, [filters.search, filters.from, filters.to, filters.period]);

    const visitWithFilters = useCallback(
        (patch: {
            search?: string;
            from?: string;
            to?: string;
            period?: CollectionsPeriodFilter | null;
        }) => {
            const nextSearch =
                patch.search !== undefined ? patch.search : search;
            const nextFrom = patch.from !== undefined ? patch.from : from;
            const nextTo = patch.to !== undefined ? patch.to : to;
            const nextPeriod =
                patch.period !== undefined ? patch.period : period;

            router.get(
                collectionsIndex.url({
                    query: {
                        search: nextSearch || undefined,
                        from: nextPeriod ? undefined : nextFrom || undefined,
                        to: nextPeriod ? undefined : nextTo || undefined,
                        period: nextPeriod ?? undefined,
                    },
                }),
                {},
                { preserveState: true, replace: true },
            );
        },
        [search, from, to, period],
    );

    const handleSearchCommit = useCallback(() => {
        visitWithFilters({ search });
    }, [visitWithFilters, search]);

    const handleRangeCommit = useCallback(() => {
        visitWithFilters({ from, to, period: null });
    }, [visitWithFilters, from, to]);

    const applyStatFilter = useCallback(
        (stat: CollectionStatItem) => {
            if (!stat.filter?.period) {
                return;
            }

            if (stat.filter.period === 'month') {
                const range = getCurrentMonthDateRange();
                setSearch('');
                setFrom(range.from);
                setTo(range.to);
                setPeriod('month');
                visitWithFilters({
                    from: range.from,
                    to: range.to,
                    period: 'month',
                    search: '',
                });

                return;
            }

            if (stat.filter.period === 'today') {
                const today = getTodayDateString();
                setSearch('');
                setFrom(today);
                setTo(today);
                setPeriod('today');
                visitWithFilters({
                    from: today,
                    to: today,
                    period: 'today',
                    search: '',
                });
            }
        },
        [visitWithFilters],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: CollectionStatItem) => {
        return stat.icon ?? COLLECTIONS_STAT_ICONS[stat.key];
    }, []);

    const isStatActive = useCallback(
        (stat: CollectionStatItem) => {
            if (!stat.filter?.period) {
                return false;
            }

            return period === stat.filter.period;
        },
        [period],
    );

    const showFilteredBadge = filteredCount !== payments.length;

    const dateRange = useMemo(
        () => ({
            from,
            to,
            onFromChange: (value: string) => {
                setFrom(value);
                setPeriod(null);
            },
            onToChange: (value: string) => {
                setTo(value);
                setPeriod(null);
            },
            onRangeCommit: handleRangeCommit,
        }),
        [from, to, handleRangeCommit],
    );

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Cobros" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Cobros"
                        description="Pagos recibidos de clientes asignados a comprobantes de venta."
                    />
                </PageHeaderTop>

                <PageHeaderBadges>
                    {stats.map((stat) => (
                        <StatBadge
                            key={stat.key}
                            label={stat.label}
                            value={String(stat.value)}
                            tone={stat.tone}
                            icon={resolveStatIcon(stat)}
                            active={isStatActive(stat)}
                            onClick={
                                stat.filter
                                    ? () => applyStatFilter(stat)
                                    : undefined
                            }
                        />
                    ))}
                    {showFilteredBadge && (
                        <StatBadge
                            label="Resultados"
                            value={filteredCount}
                            tone="pink"
                            icon={ListFilter}
                        />
                    )}
                </PageHeaderBadges>
            </PageHeader>

            <CollectionPaymentsTable
                payments={payments}
                onFilteredCountChange={handleFilteredCountChange}
                serverSearch={{
                    value: search,
                    onChange: setSearch,
                    onCommit: handleSearchCommit,
                    placeholder:
                        'Buscar por comprobante, cliente o referencia…',
                }}
                dateRange={dateRange}
            />
        </div>
    );
}

CollectionsIndex.layout = {
    breadcrumbs: tesoreriaCobrosIndex(),
};
