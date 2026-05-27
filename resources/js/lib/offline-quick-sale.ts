import { buildSalesDocumentPayload } from '@/lib/sales-document-payload';
import {
    cacheCollectionSnapshot,
    enqueuePendingAction,
    generateOfflineId,
    getCollectionSnapshot,
    isOfflineEntityId,
    listPendingActions,
    removePendingActionsByLocalEntity,
    updatePendingCreatePayload,
} from '@/lib/offline-store';
import type {
    SalesDocumentFormData,
    SalesDocumentFormPageProps,
    SalesStockByWarehouse,
} from '@/types/admin/sales-documents';

export const QUICK_SALE_CACHE_KEY = 'ventas.tickets-internos.form';
export const QUICK_SALE_RESOURCE = 'sales.internal';
export const QUICK_SALE_CREATE_PATH = '/admin/ventas/tickets-internos/nuevo';
export const QUICK_SALE_BASE_PATH = '/admin/ventas/tickets-internos';
export const OFFLINE_ID_PLACEHOLDER = '__OFFLINE_ID__';

export type QuickSaleFormSnapshot = Pick<
    SalesDocumentFormPageProps,
    | 'seriesOptions'
    | 'customerOptions'
    | 'warehouseOptions'
    | 'defaultWarehouseId'
    | 'variantOptions'
    | 'paymentMethods'
    | 'openCashSession'
    | 'oldForm'
> & {
    stockByWarehouse: SalesStockByWarehouse;
};

export function isQuickSalePath(path: string): boolean {
    return (
        path === QUICK_SALE_BASE_PATH ||
        path.startsWith(`${QUICK_SALE_BASE_PATH}/`)
    );
}

export function isQuickSaleCreatePath(path: string): boolean {
    return path === QUICK_SALE_CREATE_PATH;
}

export function persistQuickSaleFormSnapshot(
    snapshot: QuickSaleFormSnapshot,
): void {
    cacheCollectionSnapshot(QUICK_SALE_CACHE_KEY, [], {
        formProps: snapshot as unknown as Record<string, unknown>,
    });
}

export function loadQuickSaleFormSnapshot(): QuickSaleFormSnapshot | null {
    const snapshot = getCollectionSnapshot(QUICK_SALE_CACHE_KEY);

    if (!snapshot?.meta?.formProps) {
        return null;
    }

    return snapshot.meta.formProps as unknown as QuickSaleFormSnapshot;
}

export function resolveSyncEndpoint(
    endpoint: string,
    localEntityId: string,
    serverId: string,
): string {
    return endpoint
        .replace(OFFLINE_ID_PLACEHOLDER, serverId)
        .replace(localEntityId, serverId);
}

function buildOfflineDocument(
    form: SalesDocumentFormData,
    localId: string,
): SalesDocumentFormData {
    const totals = form.lines.reduce(
        (acc, line) => {
            const qty = parseFloat(line.quantity) || 0;
            const price = parseFloat(line.unit_price) || 0;
            const disc = parseFloat(line.discount) || 0;
            const sub = qty * price - disc;

            return {
                subtotal: acc.subtotal + sub,
                tax: acc.tax + sub * 0.18,
            };
        },
        { subtotal: 0, tax: 0 },
    );

    const total =
        totals.subtotal +
        totals.tax -
        (parseFloat(form.global_discount) || 0);

    return {
        ...form,
        id: localId,
        is_internal: true,
        status: 'draft',
        status_label: 'Borrador (offline)',
        full_number: null,
        subtotal: totals.subtotal.toFixed(2),
        tax_amount: totals.tax.toFixed(2),
        total: total.toFixed(2),
        total_label: total.toFixed(2),
    };
}

function findPendingSaveForLocal(localEntityId: string) {
    return listPendingActions(QUICK_SALE_RESOURCE).find(
        (action) =>
            action.localEntityId === localEntityId && action.method === 'POST',
    );
}

export function saveQuickSaleDraftOffline(
    form: SalesDocumentFormData,
    urls: { storeUrl: string; updateUrl?: string },
): SalesDocumentFormData {
    const payload = buildSalesDocumentPayload(form);
    const documentId = form.id;

    if (documentId && !isOfflineEntityId(documentId)) {
        enqueuePendingAction({
            resource: QUICK_SALE_RESOURCE,
            method: 'PUT',
            endpoint: urls.updateUrl ?? `${QUICK_SALE_BASE_PATH}/${documentId}`,
            payload: payload as Record<string, string | boolean | null>,
        });

        return buildOfflineDocument({ ...form, id: documentId }, documentId);
    }

    const localId =
        documentId && isOfflineEntityId(documentId)
            ? documentId
            : generateOfflineId();

    const existingSave = findPendingSaveForLocal(localId);

    if (existingSave) {
        updatePendingCreatePayload(
            localId,
            payload as Record<string, string | boolean | null>,
        );
    } else {
        removePendingActionsByLocalEntity(localId);
        enqueuePendingAction({
            resource: QUICK_SALE_RESOURCE,
            method: 'POST',
            endpoint: urls.storeUrl,
            localEntityId: localId,
            payload: payload as Record<string, string | boolean | null>,
        });
    }

    return buildOfflineDocument({ ...form, id: localId }, localId);
}

export function confirmQuickSaleOffline(
    form: SalesDocumentFormData,
    urls: { storeUrl: string; updateUrl?: string; confirmUrl: string },
): SalesDocumentFormData {
    const saved = saveQuickSaleDraftOffline(form, urls);
    const localId = saved.id as string;

    const saveAction = findPendingSaveForLocal(localId);
    const confirmEndpoint = isOfflineEntityId(localId)
        ? `${QUICK_SALE_BASE_PATH}/${OFFLINE_ID_PLACEHOLDER}/confirmar`
        : urls.confirmUrl;

    enqueuePendingAction({
        resource: QUICK_SALE_RESOURCE,
        method: 'POST',
        endpoint: confirmEndpoint,
        localEntityId: localId,
        dependsOn: saveAction?.id,
        payload: buildSalesDocumentPayload(saved) as Record<
            string,
            string | boolean | null
        >,
    });

    return {
        ...saved,
        status_label: 'Pendiente de confirmar',
    };
}

export function countQuickSalePendingActions(): number {
    return listPendingActions(QUICK_SALE_RESOURCE).length;
}
