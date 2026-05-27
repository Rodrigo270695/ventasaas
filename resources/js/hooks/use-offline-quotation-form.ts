import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import { notify } from '@/lib/notify';
import {
    countQuotationsPendingActions,
    loadOfflineQuotationDraft,
    loadQuotationFormSnapshot,
    persistQuotationFormSnapshot,
    QUOTATIONS_RESOURCE,
    saveQuotationOffline,
    type QuotationFormSnapshot,
} from '@/lib/offline-quotations';
import { isOfflineEntityId } from '@/lib/offline-store';
import type {
    SalesQuotationFormData,
    SalesQuotationFormPageProps,
} from '@/types/admin/sales-quotations';

type Args = Pick<
    SalesQuotationFormPageProps,
    'customerOptions' | 'variantOptions' | 'oldForm' | 'quotation'
> & {
    storeUrl: string;
    updateUrl?: string;
};

export function useOfflineQuotationForm({
    customerOptions,
    variantOptions,
    oldForm,
    quotation,
    storeUrl,
    updateUrl,
}: Args) {
    const { isOffline } = useOfflineStatus();
    const [lookups, setLookups] = useState<QuotationFormSnapshot>(() => ({
        customerOptions,
        variantOptions,
        oldForm,
    }));
    const [localQuotation, setLocalQuotation] =
        useState<SalesQuotationFormData | null>(null);
    const [pendingCount, setPendingCount] = useState(() =>
        countQuotationsPendingActions(),
    );

    const activeQuotation = localQuotation ?? quotation;

    const urls = useMemo(() => {
        const id = activeQuotation?.id;

        return {
            storeUrl,
            updateUrl: id ? `${storeUrl}/${id}` : updateUrl,
        };
    }, [storeUrl, updateUrl, activeQuotation?.id]);

    useEffect(() => {
        if (isOffline) {
            const snapshot = loadQuotationFormSnapshot();

            if (snapshot) {
                setLookups(snapshot);
            }

            if (
                quotation?.id &&
                isOfflineEntityId(quotation.id) &&
                !localQuotation
            ) {
                const draft = loadOfflineQuotationDraft(quotation.id);

                if (draft) {
                    setLocalQuotation(draft);
                }
            }

            return;
        }

        setLocalQuotation(null);

        const snapshot: QuotationFormSnapshot = {
            customerOptions,
            variantOptions,
            oldForm,
        };

        setLookups(snapshot);
        persistQuotationFormSnapshot(snapshot);
    }, [isOffline, customerOptions, variantOptions, oldForm, quotation?.id, localQuotation]);

    const refreshPendingCount = useCallback(() => {
        setPendingCount(countQuotationsPendingActions());
    }, []);

    const saveOffline = useCallback(
        (form: SalesQuotationFormData) => {
            const result = saveQuotationOffline(
                form,
                urls,
                lookups.customerOptions,
            );
            setLocalQuotation(result.quotation);
            refreshPendingCount();
            notify.success('Cotización guardada sin conexión', {
                description: 'Se sincronizará al reconectar internet.',
            });

            return result.quotation;
        },
        [lookups.customerOptions, refreshPendingCount, urls],
    );

    return {
        isOffline,
        pendingCount,
        activeQuotation,
        customerOptions: lookups.customerOptions,
        variantOptions: lookups.variantOptions,
        oldForm: lookups.oldForm,
        saveOffline,
        refreshPendingCount,
    };
}

export { QUOTATIONS_RESOURCE };
