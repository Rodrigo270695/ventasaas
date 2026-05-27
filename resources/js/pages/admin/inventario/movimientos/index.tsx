import { Head, router } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { StockMovementsTable } from '@/components/admin/inventario/stock-movements-table';
import {
    PageHeader,
    PageHeaderBadges,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { FormComboboxField } from '@/components/form';
import {
    chokoInputClass,
    chokoSelectContentClass,
    chokoSelectItemClass,
    chokoSelectTriggerClass,
} from '@/components/form/field-styles';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { inventarioMovimientosIndex } from '@/lib/admin-breadcrumbs';
import { STOCK_MOVEMENT_STAT_ICONS } from '@/lib/stock-movement-stat-icons';
import { index as movimientosIndex } from '@/routes/admin/inventario/movimientos';
import type {
    StockMovementStatItem,
    StockMovementsIndexPageProps,
} from '@/types/admin/stock-movements';

const ALL_VARIANTS = '__all_variants__';
const ALL_TYPES = '__all_types__';

export default function StockMovementsIndex({
    movements,
    filters,
    warehouseOptions,
    variantOptions,
    movementTypeOptions,
    showBalanceColumn,
    stats,
}: StockMovementsIndexPageProps) {
    const [filteredCount, setFilteredCount] = useState(movements.length);

    const warehouseId = filters.warehouse_id ?? warehouseOptions[0]?.value ?? '';

    const applyFilters = useCallback(
        (patch: Partial<StockMovementsIndexPageProps['filters']>) => {
            const next = { ...filters, ...patch };

            router.get(
                movimientosIndex.url({
                    query: {
                        warehouse_id: next.warehouse_id ?? undefined,
                        product_variant_id:
                            next.product_variant_id ?? undefined,
                        movement_type: next.movement_type ?? undefined,
                        date_from: next.date_from ?? undefined,
                        date_to: next.date_to ?? undefined,
                    },
                }),
                {},
                { preserveState: true, preserveScroll: true },
            );
        },
        [filters],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: StockMovementStatItem) => {
        return stat.icon ?? STOCK_MOVEMENT_STAT_ICONS[stat.key];
    }, []);

    const showFilteredBadge = filteredCount !== movements.length;

    const variantSelectValue =
        filters.product_variant_id ?? ALL_VARIANTS;
    const typeSelectValue = filters.movement_type ?? ALL_TYPES;

    const variantComboboxOptions = useMemo(
        () => [
            {
                value: ALL_VARIANTS,
                label: 'Todas las variantes',
                searchText: 'todas variantes',
            },
            ...variantOptions,
        ],
        [variantOptions],
    );

    const filterBar = useMemo(
        () => (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:items-end">
                {warehouseOptions.length > 0 ? (
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="kardex-warehouse"
                            className="text-xs font-semibold text-[#6d28d9]"
                        >
                            Almacén
                        </Label>
                        <Select
                            value={warehouseId}
                            onValueChange={(value) =>
                                applyFilters({ warehouse_id: value })
                            }
                        >
                            <SelectTrigger
                                id="kardex-warehouse"
                                className={chokoSelectTriggerClass}
                            >
                                <SelectValue placeholder="Almacén…" />
                            </SelectTrigger>
                            <SelectContent
                                className={chokoSelectContentClass}
                                position="popper"
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
                    </div>
                ) : null}

                <div className="space-y-1.5">
                    <Label
                        htmlFor="kardex-type"
                        className="text-xs font-semibold text-[#6d28d9]"
                    >
                        Tipo
                    </Label>
                    <Select
                        value={typeSelectValue}
                        onValueChange={(value) =>
                            applyFilters({
                                movement_type:
                                    value === ALL_TYPES ? null : value,
                            })
                        }
                    >
                        <SelectTrigger
                            id="kardex-type"
                            className={chokoSelectTriggerClass}
                        >
                            <SelectValue placeholder="Tipo…" />
                        </SelectTrigger>
                        <SelectContent
                            className={chokoSelectContentClass}
                            position="popper"
                        >
                            {movementTypeOptions.map((option) => (
                                <SelectItem
                                    key={option.value || ALL_TYPES}
                                    value={option.value || ALL_TYPES}
                                    className={chokoSelectItemClass}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <FormComboboxField
                    id="kardex-variant"
                    name="product_variant_id"
                    label="Variante"
                    value={variantSelectValue}
                    onValueChange={(value) =>
                        applyFilters({
                            product_variant_id:
                                !value || value === ALL_VARIANTS
                                    ? null
                                    : value,
                        })
                    }
                    options={variantComboboxOptions}
                    placeholder="Buscar producto o SKU…"
                    emptyMessage="Ninguna variante coincide."
                    blankValues={[ALL_VARIANTS]}
                    fieldClassName="min-w-0"
                />

                <div className="space-y-1.5">
                    <Label
                        htmlFor="kardex-from"
                        className="text-xs font-semibold text-[#6d28d9]"
                    >
                        Desde
                    </Label>
                    <Input
                        id="kardex-from"
                        type="date"
                        className={chokoInputClass}
                        value={filters.date_from ?? ''}
                        onChange={(e) =>
                            applyFilters({
                                date_from: e.target.value || null,
                            })
                        }
                    />
                </div>

                <div className="space-y-1.5">
                    <Label
                        htmlFor="kardex-to"
                        className="text-xs font-semibold text-[#6d28d9]"
                    >
                        Hasta
                    </Label>
                    <Input
                        id="kardex-to"
                        type="date"
                        className={chokoInputClass}
                        value={filters.date_to ?? ''}
                        onChange={(e) =>
                            applyFilters({
                                date_to: e.target.value || null,
                            })
                        }
                    />
                </div>
            </div>
        ),
        [
            applyFilters,
            filters.date_from,
            filters.date_to,
            movementTypeOptions,
            typeSelectValue,
            variantComboboxOptions,
            variantSelectValue,
            warehouseId,
            warehouseOptions,
        ],
    );

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Movimientos (kardex)" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Movimientos (kardex)"
                        description="Historial de ingresos y salidas por ajustes e inventario inicial. Filtra por almacén y variante para ver el saldo acumulado."
                    />
                </PageHeaderTop>

                <PageHeaderBadges>
                    {stats.map((stat) => (
                        <StatBadge
                            key={stat.key}
                            label={stat.label}
                            value={stat.value}
                            tone={stat.tone}
                            icon={resolveStatIcon(stat)}
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

                {filterBar}
            </PageHeader>

            {showBalanceColumn ? (
                <p className="text-xs text-[#7c6f8a]">
                    Columna <strong className="text-[#4c1d95]">Saldo</strong>{' '}
                    calculada para la variante y almacén seleccionados.
                </p>
            ) : null}

            <StockMovementsTable
                movements={movements}
                showBalanceColumn={showBalanceColumn}
                onFilteredCountChange={handleFilteredCountChange}
            />
        </div>
    );
}

StockMovementsIndex.layout = {
    breadcrumbs: inventarioMovimientosIndex(),
};
