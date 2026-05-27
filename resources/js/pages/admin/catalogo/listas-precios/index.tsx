import { Head, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { PriceListDeleteModal } from '@/components/admin/catalogo/price-list-delete-modal';
import { PriceListFormModal } from '@/components/admin/catalogo/price-list-form-modal';
import { PriceListsTable } from '@/components/admin/catalogo/price-lists-table';
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
import { usePriceListsModals } from '@/hooks/use-price-lists-modals';
import { catalogoListasPreciosIndex } from '@/lib/admin-breadcrumbs';
import { PRICE_LISTS_PERMISSIONS } from '@/lib/admin-permissions';
import { PRICE_LIST_STAT_ICONS } from '@/lib/price-list-stat-icons';
import type {
    PriceListStatItem,
    PriceListsIndexPageProps,
    PriceListsPageErrors,
} from '@/types/admin/price-lists';

type PageProps = PriceListsIndexPageProps & {
    errors?: PriceListsPageErrors;
};

export default function PriceListsIndex({
    priceLists,
    stats,
    priceListModal = null,
    priceListModalId = null,
    oldForm,
}: PriceListsIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const [filteredCount, setFilteredCount] = useState(priceLists.length);

    const modals = usePriceListsModals(priceLists, {
        priceListModal,
        priceListModalId,
    });

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(PRICE_LISTS_PERMISSIONS.UPDATE),
            canDelete: can(PRICE_LISTS_PERMISSIONS.DELETE),
        }),
        [can],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: PriceListStatItem) => {
        return stat.icon ?? PRICE_LIST_STAT_ICONS[stat.key];
    }, []);

    const showFilteredBadge = filteredCount !== priceLists.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Listas de precios" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Listas de precios"
                        description="Canales de venta: tienda, web, mayorista. Los montos se asignan por variante en cada producto."
                    />
                    <PageHeaderActions>
                        {can(PRICE_LISTS_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton
                                onClick={() => modals.openCreate()}
                                label="Nueva lista"
                            />
                        )}
                    </PageHeaderActions>
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
            </PageHeader>

            <PriceListsTable
                priceLists={priceLists}
                abilities={tableAbilities}
                onEdit={modals.openEdit}
                onDelete={modals.openDelete}
                onFilteredCountChange={handleFilteredCountChange}
            />

            {(can(PRICE_LISTS_PERMISSIONS.CREATE) ||
                can(PRICE_LISTS_PERMISSIONS.UPDATE)) && (
                <PriceListFormModal
                    open={modals.formOpen}
                    onOpenChange={modals.handleFormOpenChange}
                    mode={modals.formMode}
                    priceList={modals.editingPriceList}
                    errors={modals.formOpen ? errors : {}}
                    oldForm={modals.formOpen ? oldForm : undefined}
                />
            )}

            {can(PRICE_LISTS_PERMISSIONS.DELETE) && (
                <PriceListDeleteModal
                    open={modals.deleteOpen}
                    onOpenChange={modals.handleDeleteOpenChange}
                    priceList={modals.deletingPriceList}
                />
            )}
        </div>
    );
}

PriceListsIndex.layout = {
    breadcrumbs: catalogoListasPreciosIndex(),
};
