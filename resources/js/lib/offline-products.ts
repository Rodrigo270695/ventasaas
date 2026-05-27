import type { FormSelectOption } from '@/components/form';
import {
    cacheCollectionSnapshot,
    countPendingActions,
    enqueuePendingAction,
    generateOfflineId,
    getCollectionSnapshot,
    isOfflineEntityId,
    removePendingActionsByLocalEntity,
    updatePendingCreatePayload,
} from '@/lib/offline-store';
import { destroy, store } from '@/routes/admin/catalogo/productos';
import type { ProductRow, ProductStatItem, ProductType } from '@/types/admin/products';

export const PRODUCTS_CACHE_KEY = 'catalogo.productos';
export const PRODUCTS_RESOURCE = 'products';

export type ProductFormPayload = {
    name: string;
    description: string;
    type: ProductType;
    category_id: string;
    brand_id: string;
    base_unit_id: string;
    track_stock: boolean;
    is_active: boolean;
    initial_variant: {
        sku: string;
        label: string;
        barcode: string;
    };
};

type ProductsSnapshotMeta = {
    categoryOptions: FormSelectOption[];
    brandOptions: FormSelectOption[];
    unitOptions: FormSelectOption[];
};

function resolveOptionLabel(
    options: FormSelectOption[],
    value: string,
): string | null {
    if (!value) {
        return null;
    }

    return options.find((option) => option.value === value)?.label ?? null;
}

function buildStats(products: ProductRow[]): ProductStatItem[] {
    const activeCount = products.filter((row) => row.is_active).length;
    const goodsCount = products.filter((row) => row.type === 'good').length;
    const servicesCount = products.filter((row) => row.type === 'service').length;

    return [
        {
            key: 'total',
            label: 'Total',
            value: products.length,
            tone: 'violet',
        },
        {
            key: 'active',
            label: 'Activos',
            value: activeCount,
            tone: 'green',
        },
        {
            key: 'goods',
            label: 'Bienes',
            value: goodsCount,
            tone: 'cyan',
        },
        {
            key: 'services',
            label: 'Servicios',
            value: servicesCount,
            tone: 'amber',
        },
    ];
}

function buildPayloadBody(payload: ProductFormPayload) {
    return {
        name: payload.name.trim(),
        description: payload.description.trim(),
        type: payload.type,
        category_id: payload.category_id || '',
        brand_id: payload.brand_id || '',
        base_unit_id: payload.base_unit_id,
        track_stock: payload.track_stock,
        is_active: payload.is_active,
        initial_variant: {
            sku: payload.initial_variant.sku.trim(),
            label: payload.initial_variant.label.trim(),
            barcode: payload.initial_variant.barcode.trim(),
        },
    };
}

export function persistProductsSnapshot(
    products: ProductRow[],
    meta: ProductsSnapshotMeta,
): void {
    cacheCollectionSnapshot(PRODUCTS_CACHE_KEY, products, meta);
}

export function loadProductsSnapshot(): {
    products: ProductRow[];
    categoryOptions: FormSelectOption[];
    brandOptions: FormSelectOption[];
    unitOptions: FormSelectOption[];
} | null {
    const snapshot = getCollectionSnapshot<ProductRow>(PRODUCTS_CACHE_KEY);

    if (!snapshot) {
        return null;
    }

    return {
        products: snapshot.items,
        categoryOptions: Array.isArray(snapshot.meta.categoryOptions)
            ? (snapshot.meta.categoryOptions as FormSelectOption[])
            : [],
        brandOptions: Array.isArray(snapshot.meta.brandOptions)
            ? (snapshot.meta.brandOptions as FormSelectOption[])
            : [],
        unitOptions: Array.isArray(snapshot.meta.unitOptions)
            ? (snapshot.meta.unitOptions as FormSelectOption[])
            : [],
    };
}

export function createProductOffline(
    products: ProductRow[],
    payload: ProductFormPayload,
    meta: ProductsSnapshotMeta,
): ProductRow[] {
    const localId = generateOfflineId();
    const body = buildPayloadBody(payload);
    const categoryId = payload.category_id || null;
    const brandId = payload.brand_id || null;

    const nextRow: ProductRow = {
        id: localId,
        name: body.name,
        description: body.description || null,
        type: body.type,
        category_id: categoryId,
        category_name: resolveOptionLabel(meta.categoryOptions, payload.category_id),
        brand_id: brandId,
        brand_name: resolveOptionLabel(meta.brandOptions, payload.brand_id),
        base_unit_id: body.base_unit_id,
        base_unit_label: resolveOptionLabel(meta.unitOptions, payload.base_unit_id),
        track_stock: body.track_stock,
        is_active: body.is_active,
        variants_count: 1,
        default_sku: body.initial_variant.sku,
        default_barcode: body.initial_variant.barcode || null,
        default_price: null,
        default_tax_label: null,
    };

    const next = [...products, nextRow];

    enqueuePendingAction({
        resource: PRODUCTS_RESOURCE,
        method: 'POST',
        endpoint: store.url(),
        localEntityId: localId,
        payload: body,
    });

    persistProductsSnapshot(next, meta);

    return next;
}

export function deleteProductOffline(
    products: ProductRow[],
    productId: string,
    meta: ProductsSnapshotMeta,
): ProductRow[] {
    const next = products.filter((row) => row.id !== productId);

    if (isOfflineEntityId(productId)) {
        removePendingActionsByLocalEntity(productId);
    } else {
        enqueuePendingAction({
            resource: PRODUCTS_RESOURCE,
            method: 'DELETE',
            endpoint: destroy.url(productId),
            payload: {},
        });
    }

    persistProductsSnapshot(next, meta);

    return next;
}

export function buildProductsStats(products: ProductRow[]): ProductStatItem[] {
    return buildStats(products);
}

export function countProductsPendingActions(): number {
    return countPendingActions(PRODUCTS_RESOURCE);
}
