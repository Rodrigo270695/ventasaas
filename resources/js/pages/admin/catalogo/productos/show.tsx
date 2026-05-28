import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ProductGeneralForm } from '@/components/admin/catalogo/product-general-form';
import { ProductPricesPanel } from '@/components/admin/catalogo/product-prices-panel';
import { ProductShowTabs } from '@/components/admin/catalogo/product-show-tabs';
import { ProductStockPanel } from '@/components/admin/catalogo/product-stock-panel';
import { ProductTaxProfilesPanel } from '@/components/admin/catalogo/product-tax-profiles-panel';
import { ProductPackagingConversionsPanel } from '@/components/admin/catalogo/product-packaging-conversions-panel';
import { ProductVariantsPanel } from '@/components/admin/catalogo/product-variants-panel';
import {
    PageHeader,
    PageHeaderBadges,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { catalogoProductosIndex } from '@/lib/admin-breadcrumbs';
import {
    PRICE_LISTS_PERMISSIONS,
    PRODUCTS_PERMISSIONS,
    STOCK_BALANCES_PERMISSIONS,
    TAX_PROFILES_PERMISSIONS,
} from '@/lib/admin-permissions';
import { PRODUCT_TYPE_LABELS } from '@/lib/product-stat-icons';
import { index as productsIndex } from '@/routes/admin/catalogo/productos';
import type {
    ProductsPageErrors,
    ProductsShowPageProps,
} from '@/types/admin/products';

type PageProps = ProductsShowPageProps & {
    errors?: ProductsPageErrors;
};

export default function ProductsShow({
    product,
    packagingConversions = [],
    tab,
    categoryOptions,
    brandOptions,
    unitOptions,
    priceListOptions,
    taxProfileOptions,
    warehouseOptions,
    defaultWarehouseId,
    defaultWarehouseLabel,
}: ProductsShowPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const canUpdate = can(PRODUCTS_PERMISSIONS.UPDATE);
    const canManageVariants =
        can(PRODUCTS_PERMISSIONS.CREATE) || can(PRODUCTS_PERMISSIONS.UPDATE);
    const canDeleteVariants = can(PRODUCTS_PERMISSIONS.DELETE);
    const canManagePrices =
        can(PRICE_LISTS_PERMISSIONS.UPDATE) ||
        can(PRODUCTS_PERMISSIONS.UPDATE);
    const canManageTaxProfiles =
        can(TAX_PROFILES_PERMISSIONS.UPDATE) ||
        can(PRODUCTS_PERMISSIONS.UPDATE);
    const canManageStock =
        can(STOCK_BALANCES_PERMISSIONS.ADJUST) ||
        can(PRODUCTS_PERMISSIONS.UPDATE);

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title={product.name} />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-fit cursor-pointer gap-1 px-2 text-[#7c6f8a] hover:text-[#5b4d6e]"
                            asChild
                        >
                            <Link href={productsIndex.url()}>
                                <ArrowLeft className="size-3.5" />
                                Productos
                            </Link>
                        </Button>
                        <PageHeaderTitle
                            title={product.name}
                            description="Ficha del producto: datos, variantes, precios, impuestos y stock."
                        />
                    </div>
                </PageHeaderTop>

                <PageHeaderBadges>
                    <StatBadge
                        label="SKU principal"
                        value={product.default_sku ?? '—'}
                        tone="violet"
                    />
                    <StatBadge
                        label="Tipo"
                        value={PRODUCT_TYPE_LABELS[product.type]}
                        tone={product.type === 'service' ? 'amber' : 'cyan'}
                    />
                    <StatBadge
                        label="Variantes"
                        value={product.variants_count}
                        tone="pink"
                    />
                    <StatBadge
                        label="Estado"
                        value={product.is_active ? 'Activo' : 'Inactivo'}
                        tone={product.is_active ? 'green' : 'slate'}
                    />
                </PageHeaderBadges>
            </PageHeader>

            <ProductShowTabs productId={product.id} activeTab={tab} />

            <div className="rounded-xl border border-violet-100/90 bg-white p-4 shadow-sm shadow-violet-100/30 md:p-5">
                {tab === 'general' && (
                    <ProductGeneralForm
                        product={product}
                        categoryOptions={categoryOptions}
                        brandOptions={brandOptions}
                        unitOptions={unitOptions}
                        canUpdate={canUpdate}
                        errors={errors}
                    />
                )}

                {tab === 'variantes' && (
                    <ProductVariantsPanel
                        productId={product.id}
                        productName={product.name}
                        variants={product.variants}
                        canManage={canManageVariants}
                        canDelete={canDeleteVariants}
                        errors={errors}
                    />
                )}

                {tab === 'precios' && (
                    <ProductPricesPanel
                        productId={product.id}
                        variants={product.variants}
                        priceListOptions={priceListOptions}
                        canManage={canManagePrices}
                        errors={errors}
                    />
                )}

                {tab === 'impuestos' && (
                    <ProductTaxProfilesPanel
                        productId={product.id}
                        variants={product.variants}
                        taxProfileOptions={taxProfileOptions}
                        canManage={canManageTaxProfiles}
                        errors={errors}
                    />
                )}

                {tab === 'stock' && (
                    <ProductStockPanel
                        productId={product.id}
                        trackStock={product.track_stock}
                        variants={product.variants}
                        warehouseOptions={warehouseOptions}
                        defaultWarehouseId={defaultWarehouseId}
                        defaultWarehouseLabel={defaultWarehouseLabel}
                        canManage={canManageStock}
                    />
                )}

                {tab === 'empaque' && (
                    <ProductPackagingConversionsPanel
                        product={product}
                        conversions={packagingConversions}
                        canManage={canUpdate}
                        errors={errors}
                    />
                )}
            </div>
        </div>
    );
}

ProductsShow.layout = {
    breadcrumbs: catalogoProductosIndex(),
};
