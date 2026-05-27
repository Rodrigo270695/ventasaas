import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormSelectOption } from '@/components/form';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import {
    buildProductsStats,
    countProductsPendingActions,
    createProductOffline,
    deleteProductOffline,
    loadProductsSnapshot,
    persistProductsSnapshot,
    PRODUCTS_RESOURCE,
    type ProductFormPayload,
} from '@/lib/offline-products';
import type { ProductRow, ProductStatItem } from '@/types/admin/products';

type Args = {
    serverProducts: ProductRow[];
    serverCategoryOptions: FormSelectOption[];
    serverBrandOptions: FormSelectOption[];
    serverUnitOptions: FormSelectOption[];
    serverStats: ProductStatItem[];
};

export function useOfflineProducts({
    serverProducts,
    serverCategoryOptions,
    serverBrandOptions,
    serverUnitOptions,
    serverStats,
}: Args) {
    const { isOffline } = useOfflineStatus();
    const [products, setProducts] = useState<ProductRow[]>(serverProducts);
    const [categoryOptions, setCategoryOptions] = useState(serverCategoryOptions);
    const [brandOptions, setBrandOptions] = useState(serverBrandOptions);
    const [unitOptions, setUnitOptions] = useState(serverUnitOptions);
    const [pendingCount, setPendingCount] = useState(() =>
        countProductsPendingActions(),
    );

    const meta = useMemo(
        () => ({
            categoryOptions,
            brandOptions,
            unitOptions,
        }),
        [categoryOptions, brandOptions, unitOptions],
    );

    useEffect(() => {
        if (isOffline) {
            const snapshot = loadProductsSnapshot();

            if (snapshot) {
                setProducts(snapshot.products);
                setCategoryOptions(snapshot.categoryOptions);
                setBrandOptions(snapshot.brandOptions);
                setUnitOptions(snapshot.unitOptions);
            }

            return;
        }

        setProducts(serverProducts);
        setCategoryOptions(serverCategoryOptions);
        setBrandOptions(serverBrandOptions);
        setUnitOptions(serverUnitOptions);
        persistProductsSnapshot(serverProducts, {
            categoryOptions: serverCategoryOptions,
            brandOptions: serverBrandOptions,
            unitOptions: serverUnitOptions,
        });
    }, [
        isOffline,
        serverProducts,
        serverCategoryOptions,
        serverBrandOptions,
        serverUnitOptions,
    ]);

    useEffect(() => {
        setPendingCount(countProductsPendingActions());
    }, [products]);

    const stats = useMemo(() => {
        if (!isOffline) {
            return serverStats;
        }

        return buildProductsStats(products);
    }, [isOffline, products, serverStats]);

    const refreshPendingCount = useCallback(() => {
        setPendingCount(countProductsPendingActions());
    }, []);

    const createOffline = useCallback(
        (payload: ProductFormPayload) => {
            setProducts((current) => createProductOffline(current, payload, meta));
            refreshPendingCount();
        },
        [meta, refreshPendingCount],
    );

    const deleteOffline = useCallback(
        (productId: string) => {
            setProducts((current) => deleteProductOffline(current, productId, meta));
            refreshPendingCount();
        },
        [meta, refreshPendingCount],
    );

    return {
        products,
        categoryOptions,
        brandOptions,
        unitOptions,
        stats,
        isOffline,
        pendingCount,
        createOffline,
        deleteOffline,
    };
}

export { PRODUCTS_RESOURCE };
