import { useEffect } from 'react';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import { syncPendingActions } from '@/lib/offline-sync';

export function OfflineSyncManager() {
    const { isOnline } = useOfflineStatus();

    useEffect(() => {
        if (!isOnline) {
            return;
        }

        void syncPendingActions();
    }, [isOnline]);

    return null;
}
