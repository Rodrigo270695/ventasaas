import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import {
    buildQuotationsStats,
    countQuotationsPendingActions,
    loadQuotationsIndexSnapshot,
    persistQuotationsIndexSnapshot,
    QUOTATIONS_RESOURCE,
} from '@/lib/offline-quotations';
import type {
    SalesQuotationIndexPageProps,
    SalesQuotationListRow,
} from '@/types/admin/sales-quotations';

type Args = {
    serverQuotations: SalesQuotationListRow[];
    serverStats: SalesQuotationIndexPageProps['stats'];
};

export function useOfflineQuotationsIndex({
    serverQuotations,
    serverStats,
}: Args) {
    const { isOffline } = useOfflineStatus();
    const [quotations, setQuotations] =
        useState<SalesQuotationListRow[]>(serverQuotations);
    const [pendingCount, setPendingCount] = useState(() =>
        countQuotationsPendingActions(),
    );

    useEffect(() => {
        if (isOffline) {
            const snapshot = loadQuotationsIndexSnapshot();

            if (snapshot) {
                setQuotations(snapshot);
            }

            return;
        }

        setQuotations(serverQuotations);
        persistQuotationsIndexSnapshot(serverQuotations);
    }, [isOffline, serverQuotations]);

    useEffect(() => {
        setPendingCount(countQuotationsPendingActions());
    }, [quotations]);

    const stats = useMemo(() => {
        if (!isOffline) {
            return serverStats;
        }

        return buildQuotationsStats(quotations);
    }, [isOffline, quotations, serverStats]);

    const refreshFromCache = useCallback(() => {
        const snapshot = loadQuotationsIndexSnapshot();

        if (snapshot) {
            setQuotations(snapshot);
        }

        setPendingCount(countQuotationsPendingActions());
    }, []);

    return {
        quotations,
        stats,
        isOffline,
        pendingCount,
        refreshFromCache,
    };
}

export { QUOTATIONS_RESOURCE };
