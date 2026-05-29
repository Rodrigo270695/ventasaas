import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeftRight, ListFilter, PackageOpen, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StockAdjustFormModal } from '@/components/admin/inventario/stock-adjust-form-modal';
import { StockBreakdownFormModal } from '@/components/admin/inventario/stock-breakdown-form-modal';
import { StockTransferFormModal } from '@/components/admin/inventario/stock-transfer-form-modal';
import { StockBalancesTable } from '@/components/admin/inventario/stock-balances-table';
import {
    PageHeader,
    PageHeaderActions,
    PageHeaderBadges,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import {
    chokoSelectContentClass,
    chokoSelectItemClass,
    chokoSelectTriggerClass,
} from '@/components/form/field-styles';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { inventarioSaldosIndex } from '@/lib/admin-breadcrumbs';
import {
    PRICE_LISTS_PERMISSIONS,
    PRODUCTS_PERMISSIONS,
    STOCK_BALANCES_PERMISSIONS,
} from '@/lib/admin-permissions';
import { STOCK_BALANCE_STAT_ICONS } from '@/lib/stock-balance-stat-icons';
import {
    STOCK_EXPIRY_FILTER_OPTIONS,
    type StockExpiryFilter,
} from '@/lib/stock-expiry-filter';
import { index as saldosIndex } from '@/routes/admin/inventario/saldos';
import type {
    StockBalanceRow,
    StockBalanceStatItem,
    StockBalancesIndexPageProps,
    StockBalancesPageErrors,
} from '@/types/admin/stock-balances';

type PageProps = StockBalancesIndexPageProps & {
    errors?: StockBalancesPageErrors;
};

export default function StockBalancesIndex({
    balances,
    warehouseOptions,
    selectedWarehouseId,
    filters,
    variantOptions,
    priceListOptions = [],
    packagingConversions = [],
    stats,
    stockAdjustModal = null,
    stockAdjustVariantId = null,
    stockAdjustWarehouseId = null,
    openAdjustOnLoad = false,
    oldForm,
}: StockBalancesIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const [filteredCount, setFilteredCount] = useState(balances.length);
    const [adjustOpen, setAdjustOpen] = useState(stockAdjustModal === 'open');
    const [transferOpen, setTransferOpen] = useState(false);
    const [breakdownOpen, setBreakdownOpen] = useState(false);
    const [adjustPreset, setAdjustPreset] = useState<{
        variantId: string | null;
        quantity: string;
        unitCost: string;
    }>({
        variantId: stockAdjustVariantId,
        quantity: '',
        unitCost: '',
    });

    const warehouseId =
        filters.warehouse_id ??
        selectedWarehouseId ??
        warehouseOptions[0]?.value ??
        '';

    const expiryFilter = filters.expiry_filter ?? 'all';

    const applyFilters = useCallback(
        (next: {
            warehouse_id?: string;
            expiry_filter?: StockExpiryFilter;
        }) => {
            router.get(
                saldosIndex.url({
                    query: {
                        warehouse_id: next.warehouse_id ?? warehouseId,
                        expiry_filter: next.expiry_filter ?? expiryFilter,
                    },
                }),
                {},
                { preserveState: true, preserveScroll: true },
            );
        },
        [warehouseId, expiryFilter],
    );

    const handleWarehouseChange = useCallback(
        (value: string) => {
            applyFilters({ warehouse_id: value });
        },
        [applyFilters],
    );

    const handleExpiryFilterChange = useCallback(
        (value: StockExpiryFilter) => {
            applyFilters({ expiry_filter: value });
        },
        [applyFilters],
    );

    const canAdjust = can(STOCK_BALANCES_PERMISSIONS.ADJUST);
    const canSyncSalePrices =
        can(PRODUCTS_PERMISSIONS.UPDATE) ||
        can(PRICE_LISTS_PERMISSIONS.UPDATE);
    const didOpenDeepLink = useRef(false);

    const openAdjust = useCallback((row?: StockBalanceRow) => {
        setAdjustPreset({
            variantId:
                row?.product_variant_id ?? stockAdjustVariantId ?? null,
            quantity: row?.quantity_on_hand ?? '',
            unitCost: row?.avg_cost ?? '',
        });
        setAdjustOpen(true);
    }, [stockAdjustVariantId]);

    useEffect(() => {
        if (
            !openAdjustOnLoad ||
            !canAdjust ||
            !stockAdjustVariantId ||
            didOpenDeepLink.current
        ) {
            return;
        }

        didOpenDeepLink.current = true;
        const row = balances.find(
            (balance) =>
                balance.product_variant_id === stockAdjustVariantId,
        );
        openAdjust(row);
    }, [
        openAdjustOnLoad,
        canAdjust,
        stockAdjustVariantId,
        balances,
        openAdjust,
    ]);

    const handleAdjustOpenChange = useCallback((open: boolean) => {
        setAdjustOpen(open);

        if (!open) {
            setAdjustPreset({
                variantId: null,
                quantity: '',
                unitCost: '',
            });

            router.visit(
                saldosIndex.url({
                    query: {
                        warehouse_id: warehouseId,
                        expiry_filter: expiryFilter,
                        _reset: 1,
                    },
                }),
                { preserveScroll: true, replace: true },
            );
        }
    }, [warehouseId, expiryFilter]);

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: StockBalanceStatItem) => {
        return stat.icon ?? STOCK_BALANCE_STAT_ICONS[stat.key];
    }, []);

    const showFilteredBadge =
        expiryFilter !== 'all' || filteredCount !== balances.length;

    const warehouseFilter =
        warehouseOptions.length > 0 ? (
            <Select
                value={warehouseId}
                onValueChange={handleWarehouseChange}
            >
                <SelectTrigger
                    id="stock-warehouse-filter"
                    aria-label="Filtrar por almacén"
                    className={chokoSelectTriggerClass}
                >
                    <SelectValue placeholder="Almacén…" />
                </SelectTrigger>
                <SelectContent
                    className={chokoSelectContentClass}
                    position="popper"
                    sideOffset={4}
                >
                    {warehouseOptions.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            className={chokoSelectItemClass}
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        ) : null;

    const expiryFilterControl = (
        <Select
            value={expiryFilter}
            onValueChange={(value) =>
                handleExpiryFilterChange(value as StockExpiryFilter)
            }
        >
            <SelectTrigger
                id="stock-expiry-filter"
                aria-label="Filtrar por vencimiento"
                className={chokoSelectTriggerClass}
            >
                <SelectValue placeholder="Vencimiento…" />
            </SelectTrigger>
            <SelectContent
                className={chokoSelectContentClass}
                position="popper"
                sideOffset={4}
            >
                {STOCK_EXPIRY_FILTER_OPTIONS.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                        className={chokoSelectItemClass}
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    const tableToolbar = (
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2 lg:shrink-0">
            <div className="w-full sm:w-[min(100%,14rem)] lg:w-56">
                {expiryFilterControl}
            </div>
            {warehouseFilter ? (
                <div className="w-full sm:w-[min(100%,12rem)] lg:w-48">
                    {warehouseFilter}
                </div>
            ) : null}
        </div>
    );

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Stock Por almacen" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Stock Por almacen"
                        description="Único lugar para cargar o corregir stock. Cada ajuste queda en el kardex."
                    />
                    <PageHeaderActions>
                        {canAdjust && warehouseId && (
                            <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setAdjustPreset((prev) => ({
                                            ...prev,
                                            variantId:
                                                prev.variantId ??
                                                stockAdjustVariantId,
                                        }));
                                        setTransferOpen(true);
                                    }}
                                    className="cursor-pointer rounded-xl border-violet-200 text-[#6d28d9]"
                                >
                                    <ArrowLeftRight className="mr-1.5 size-4" />
                                    Trasladar
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setBreakdownOpen(true)}
                                    className="cursor-pointer rounded-xl border-violet-200 text-[#6d28d9]"
                                >
                                    <PackageOpen className="mr-1.5 size-4" />
                                    Desglosar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => openAdjust()}
                                    className="cursor-pointer rounded-xl bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-bold text-white hover:opacity-95"
                                >
                                    <Plus className="mr-1.5 size-4" />
                                    Ajustar stock
                                </Button>
                            </div>
                        )}
                    </PageHeaderActions>
                </PageHeaderTop>

                <PageHeaderBadges>
                    {stats.map((stat) => {
                        const expiryFilterForStat =
                            stat.key === 'expiring'
                                ? 'expiring'
                                : stat.key === 'expired'
                                  ? 'expired'
                                  : null;

                        return (
                            <StatBadge
                                key={stat.key}
                                label={stat.label}
                                value={stat.value}
                                tone={stat.tone}
                                icon={resolveStatIcon(stat)}
                                active={
                                    expiryFilterForStat !== null &&
                                    expiryFilter === expiryFilterForStat
                                }
                                onClick={
                                    expiryFilterForStat
                                        ? () => {
                                              handleExpiryFilterChange(
                                                  expiryFilter === expiryFilterForStat
                                                      ? 'all'
                                                      : expiryFilterForStat,
                                              );
                                          }
                                        : undefined
                                }
                            />
                        );
                    })}
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

            <StockBalancesTable
                balances={balances}
                expiryFilter={expiryFilter}
                canAdjust={canAdjust}
                onAdjust={openAdjust}
                onFilteredCountChange={handleFilteredCountChange}
                toolbarEnd={tableToolbar}
            />

            {canAdjust && warehouseId && (
                <>
                    <StockAdjustFormModal
                        open={adjustOpen}
                        onOpenChange={handleAdjustOpenChange}
                        warehouseId={warehouseId}
                        warehouseOptions={warehouseOptions}
                        variantOptions={variantOptions}
                        priceListOptions={priceListOptions}
                        canSyncSalePrices={canSyncSalePrices}
                        initialVariantId={adjustPreset.variantId}
                        initialQuantity={adjustPreset.quantity}
                        initialUnitCost={adjustPreset.unitCost}
                        oldForm={adjustOpen ? oldForm : undefined}
                        errors={adjustOpen ? errors : {}}
                    />
                    <StockTransferFormModal
                        open={transferOpen}
                        onOpenChange={setTransferOpen}
                        warehouseOptions={warehouseOptions}
                        variantOptions={variantOptions}
                        defaultFromWarehouseId={warehouseId}
                        initialVariantId={adjustPreset.variantId}
                        errors={transferOpen ? errors : {}}
                    />
                    <StockBreakdownFormModal
                        open={breakdownOpen}
                        onOpenChange={setBreakdownOpen}
                        warehouseOptions={warehouseOptions}
                        variantOptions={variantOptions}
                        packagingConversions={packagingConversions}
                        defaultWarehouseId={warehouseId}
                        initialVariantId={adjustPreset.variantId}
                        errors={breakdownOpen ? errors : {}}
                    />
                </>
            )}
        </div>
    );
}

StockBalancesIndex.layout = {
    breadcrumbs: inventarioSaldosIndex(),
};
