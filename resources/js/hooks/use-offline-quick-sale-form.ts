import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import { notify } from '@/lib/notify';
import {
    confirmQuickSaleOffline,
    countQuickSalePendingActions,
    loadQuickSaleFormSnapshot,
    persistQuickSaleFormSnapshot,
    QUICK_SALE_RESOURCE,
    saveQuickSaleDraftOffline,
    type QuickSaleFormSnapshot,
} from '@/lib/offline-quick-sale';
import type {
    SalesDocumentFormData,
    SalesDocumentFormPageProps,
} from '@/types/admin/sales-documents';

type Args = Pick<
    SalesDocumentFormPageProps,
    | 'seriesOptions'
    | 'customerOptions'
    | 'warehouseOptions'
    | 'defaultWarehouseId'
    | 'variantOptions'
    | 'stockByWarehouse'
    | 'paymentMethods'
    | 'openCashSession'
    | 'oldForm'
    | 'document'
> & {
    storeUrl: string;
    updateUrl?: string;
    confirmUrl?: string;
};

export function useOfflineQuickSaleForm({
    seriesOptions,
    customerOptions,
    warehouseOptions,
    defaultWarehouseId,
    variantOptions,
    stockByWarehouse = {},
    paymentMethods = [],
    openCashSession = null,
    oldForm,
    document,
    storeUrl,
    updateUrl,
    confirmUrl,
}: Args) {
    const { isOffline } = useOfflineStatus();
    const [lookups, setLookups] = useState<QuickSaleFormSnapshot>(() => ({
        seriesOptions,
        customerOptions,
        warehouseOptions,
        defaultWarehouseId,
        variantOptions,
        stockByWarehouse,
        paymentMethods,
        openCashSession,
        oldForm,
    }));
    const [localDocument, setLocalDocument] =
        useState<SalesDocumentFormData | null>(null);
    const [pendingCount, setPendingCount] = useState(() =>
        countQuickSalePendingActions(),
    );

    const activeDocument = localDocument ?? document;

    const urls = useMemo(() => {
        const id = activeDocument?.id;

        return {
            storeUrl,
            updateUrl: id ? `${storeUrl}/${id}` : updateUrl,
            confirmUrl: id ? `${storeUrl}/${id}/confirmar` : confirmUrl ?? '',
        };
    }, [storeUrl, updateUrl, confirmUrl, activeDocument?.id]);

    useEffect(() => {
        if (isOffline) {
            const snapshot = loadQuickSaleFormSnapshot();

            if (snapshot) {
                setLookups(snapshot);
            }

            return;
        }

        const snapshot: QuickSaleFormSnapshot = {
            seriesOptions,
            customerOptions,
            warehouseOptions,
            defaultWarehouseId,
            variantOptions,
            stockByWarehouse,
            paymentMethods,
            openCashSession,
            oldForm,
        };

        setLookups(snapshot);
        persistQuickSaleFormSnapshot(snapshot);
    }, [
        isOffline,
        seriesOptions,
        customerOptions,
        warehouseOptions,
        defaultWarehouseId,
        variantOptions,
        stockByWarehouse,
        paymentMethods,
        openCashSession,
        oldForm,
    ]);

    const refreshPendingCount = useCallback(() => {
        setPendingCount(countQuickSalePendingActions());
    }, []);

    const saveOffline = useCallback(
        (form: SalesDocumentFormData) => {
            const saved = saveQuickSaleDraftOffline(form, urls);
            setLocalDocument(saved);
            refreshPendingCount();
            notify.success('Borrador guardado sin conexión');

            return saved;
        },
        [refreshPendingCount, urls],
    );

    const confirmOffline = useCallback(
        (form: SalesDocumentFormData) => {
            confirmQuickSaleOffline(form, urls);
            setLocalDocument(null);
            refreshPendingCount();
            notify.success(
                'Venta encolada. Se numerará al reconectar.',
            );
        },
        [refreshPendingCount, urls],
    );

    return {
        isOffline,
        pendingCount,
        activeDocument,
        seriesOptions: lookups.seriesOptions,
        customerOptions: lookups.customerOptions,
        warehouseOptions: lookups.warehouseOptions,
        defaultWarehouseId: lookups.defaultWarehouseId,
        variantOptions: lookups.variantOptions,
        stockByWarehouse: lookups.stockByWarehouse,
        paymentMethods: lookups.paymentMethods,
        openCashSession: lookups.openCashSession,
        oldForm: lookups.oldForm,
        saveOffline,
        confirmOffline,
        refreshPendingCount,
    };
}

export { QUICK_SALE_RESOURCE };
