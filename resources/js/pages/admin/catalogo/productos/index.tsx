import { Head, router, usePage } from '@inertiajs/react';
import { CloudOff, ListFilter } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductDeleteModal } from '@/components/admin/catalogo/product-delete-modal';
import { ProductFormModal } from '@/components/admin/catalogo/product-form-modal';
import { ProductStockModal } from '@/components/admin/catalogo/product-stock-modal';
import { ProductsTable } from '@/components/admin/catalogo/products-table';
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
import { useCan } from '@/hooks/use-can';
import { useOfflineProducts } from '@/hooks/use-offline-products';
import { useProductsModals } from '@/hooks/use-products-modals';
import { catalogoProductosIndex } from '@/lib/admin-breadcrumbs';
import { PRODUCTS_PERMISSIONS, STOCK_BALANCES_PERMISSIONS } from '@/lib/admin-permissions';
import { isOfflineEntityId } from '@/lib/offline-store';
import { notify } from '@/lib/notify';
import { PRODUCT_STAT_ICONS } from '@/lib/product-stat-icons';
import { show as productShow } from '@/routes/admin/catalogo/productos';
import type {
    ProductRow,
    ProductStatItem,
    ProductsIndexPageProps,
    ProductsPageErrors,
} from '@/types/admin/products';

type PageProps = ProductsIndexPageProps & {
    errors?: ProductsPageErrors;
};

export default function ProductsIndex({
    products: serverProducts,
    stats: serverStats,
    categoryOptions: serverCategoryOptions,
    brandOptions: serverBrandOptions,
    unitOptions: serverUnitOptions,
    productModal = null,
    oldForm,
    warehouseOptions = [],
    defaultWarehouseId = null,
}: ProductsIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const {
        products,
        categoryOptions,
        brandOptions,
        unitOptions,
        stats,
        isOffline,
        pendingCount,
        createOffline,
        deleteOffline,
    } = useOfflineProducts({
        serverProducts,
        serverCategoryOptions,
        serverBrandOptions,
        serverUnitOptions,
        serverStats,
    });

    const [filteredCount, setFilteredCount] = useState(products.length);
    const [stockProduct, setStockProduct] = useState<ProductRow | null>(null);
    const [stockOpen, setStockOpen] = useState(false);

    useEffect(() => {
        setFilteredCount(products.length);
    }, [products.length]);

    const modals = useProductsModals({ productModal });

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(PRODUCTS_PERMISSIONS.UPDATE) && !isOffline,
            canDelete: can(PRODUCTS_PERMISSIONS.DELETE),
            canViewStock:
                can(STOCK_BALANCES_PERMISSIONS.VIEW) &&
                !isOffline,
        }),
        [can, isOffline],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: ProductStatItem) => {
        return stat.icon ?? PRODUCT_STAT_ICONS[stat.key];
    }, []);

    const openProductStock = useCallback((product: ProductRow) => {
        setStockProduct(product);
        setStockOpen(true);
    }, []);

    const handleStockOpenChange = useCallback((open: boolean) => {
        setStockOpen(open);

        if (!open) {
            setStockProduct(null);
        }
    }, []);

    const openProduct = useCallback(
        (product: ProductRow) => {
            if (isOfflineEntityId(product.id)) {
                notify.info(
                    'Producto pendiente de sincronizar. Abre la ficha cuando haya internet.',
                );

                return;
            }

            router.visit(productShow.url(product.id));
        },
        [],
    );

    const handleOfflineCreate = useCallback(
        (payload: Parameters<typeof createOffline>[0]) => {
            createOffline(payload);
            notify.success('Producto guardado localmente', {
                description: 'Se sincronizará al reconectar internet.',
            });
        },
        [createOffline],
    );

    const handleOfflineDelete = useCallback(
        (productId: string) => {
            deleteOffline(productId);
            notify.success('Eliminación pendiente', {
                description: 'Se aplicará al reconectar internet.',
            });
        },
        [deleteOffline],
    );

    const showFilteredBadge = filteredCount !== products.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Productos" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Productos"
                        description={
                            isOffline
                                ? 'Sin internet: listado en caché. Puedes crear o eliminar; se sincronizará al reconectar.'
                                : 'Catálogo de bienes y servicios para ventas e inventario.'
                        }
                    />
                    <PageHeaderActions>
                        {can(PRODUCTS_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton
                                onClick={() => modals.openCreate()}
                                label="Nuevo producto"
                            />
                        )}
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

            <ProductsTable
                products={products}
                abilities={tableAbilities}
                onOpen={openProduct}
                onDelete={modals.openDelete}
                onViewStock={openProductStock}
                onFilteredCountChange={handleFilteredCountChange}
            />

            {can(PRODUCTS_PERMISSIONS.CREATE) && (
                <ProductFormModal
                    open={modals.formOpen}
                    onOpenChange={modals.handleFormOpenChange}
                    categoryOptions={categoryOptions}
                    brandOptions={brandOptions}
                    unitOptions={unitOptions}
                    errors={modals.formOpen ? errors : {}}
                    oldForm={modals.formOpen ? oldForm : undefined}
                    isOffline={isOffline}
                    onOfflineCreate={handleOfflineCreate}
                />
            )}

            {can(PRODUCTS_PERMISSIONS.DELETE) && (
                <ProductDeleteModal
                    open={modals.deleteOpen}
                    onOpenChange={modals.handleDeleteOpenChange}
                    product={modals.deletingProduct}
                    isOffline={isOffline}
                    onOfflineDelete={handleOfflineDelete}
                />
            )}

            {tableAbilities.canViewStock && (
                <ProductStockModal
                    open={stockOpen}
                    onOpenChange={handleStockOpenChange}
                    product={stockProduct}
                    warehouseOptions={warehouseOptions}
                    defaultWarehouseId={defaultWarehouseId}
                />
            )}
        </div>
    );
}

ProductsIndex.layout = {
    breadcrumbs: catalogoProductosIndex(),
};
