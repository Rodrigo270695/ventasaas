import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { persistQuotationFormSnapshot } from '@/lib/offline-quotations';
import { persistQuickSaleFormSnapshot } from '@/lib/offline-quick-sale';
import { persistProductsSnapshot } from '@/lib/offline-products';
import { persistPartiesSnapshot } from '@/lib/offline-parties';
import { persistQuotationsIndexSnapshot } from '@/lib/offline-quotations';
import { cacheCollectionSnapshot } from '@/lib/offline-store';
import type { ProductsIndexPageProps } from '@/types/admin/products';
import type { PartiesIndexPageProps } from '@/types/admin/parties';
import type { SalesDocumentFormPageProps } from '@/types/admin/sales-documents';
import type {
    SalesQuotationFormPageProps,
    SalesQuotationIndexPageProps,
} from '@/types/admin/sales-quotations';

type OfflineSourceConfig = {
    component: string;
    propKey: string;
    cacheKey: string;
};

const OFFLINE_SOURCES: OfflineSourceConfig[] = [
    {
        component: 'admin/catalogo/categorias/index',
        propKey: 'categories',
        cacheKey: 'catalogo.categorias',
    },
];

export function OfflineBootstrap() {
    const page = usePage<Record<string, unknown>>();
    const currentComponent = page.component;

    useEffect(() => {
        if (currentComponent === 'admin/ventas/tickets-internos/form') {
            const props = page.props as unknown as SalesDocumentFormPageProps;

            persistQuickSaleFormSnapshot({
                seriesOptions: props.seriesOptions ?? [],
                customerOptions: props.customerOptions ?? [],
                warehouseOptions: props.warehouseOptions ?? [],
                defaultWarehouseId: props.defaultWarehouseId ?? null,
                variantOptions: props.variantOptions ?? [],
                stockByWarehouse: props.stockByWarehouse ?? {},
                paymentMethods: props.paymentMethods ?? [],
                openCashSession: props.openCashSession ?? null,
                oldForm: props.oldForm,
            });

            return;
        }

        if (currentComponent === 'admin/catalogo/productos/index') {
            const props = page.props as unknown as ProductsIndexPageProps;

            persistProductsSnapshot(props.products ?? [], {
                categoryOptions: props.categoryOptions ?? [],
                brandOptions: props.brandOptions ?? [],
                unitOptions: props.unitOptions ?? [],
            });

            return;
        }

        if (currentComponent === 'admin/socios/index') {
            const props = page.props as unknown as PartiesIndexPageProps;

            persistPartiesSnapshot(props.parties ?? []);

            return;
        }

        if (currentComponent === 'admin/ventas/cotizaciones/index') {
            const props = page.props as unknown as SalesQuotationIndexPageProps;

            persistQuotationsIndexSnapshot(props.quotations ?? []);

            return;
        }

        if (currentComponent === 'admin/ventas/cotizaciones/form') {
            const props = page.props as unknown as SalesQuotationFormPageProps;

            persistQuotationFormSnapshot({
                customerOptions: props.customerOptions ?? [],
                variantOptions: props.variantOptions ?? [],
                oldForm: props.oldForm,
            });

            return;
        }

        const source = OFFLINE_SOURCES.find(
            (item) => item.component === currentComponent,
        );

        if (!source) {
            return;
        }

        const maybeItems = page.props[source.propKey];
        if (!Array.isArray(maybeItems)) {
            return;
        }

        cacheCollectionSnapshot(source.cacheKey, maybeItems, {
            parentOptions: page.props.parentOptions ?? [],
        });
    }, [currentComponent, page.props]);

    return null;
}
