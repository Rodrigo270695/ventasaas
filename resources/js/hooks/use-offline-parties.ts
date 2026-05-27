import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import {
    buildPartiesStats,
    countPartiesPendingActions,
    createPartyOffline,
    deletePartyOffline,
    loadPartiesSnapshot,
    PARTIES_RESOURCE,
    persistPartiesSnapshot,
    updatePartyOffline,
    type PartyFormPayload,
} from '@/lib/offline-parties';
import type { PartyRow, PartyStatItem } from '@/types/admin/parties';

type Args = {
    serverParties: PartyRow[];
    serverStats: PartyStatItem[];
};

export function useOfflineParties({ serverParties, serverStats }: Args) {
    const { isOffline } = useOfflineStatus();
    const [parties, setParties] = useState<PartyRow[]>(serverParties);
    const [pendingCount, setPendingCount] = useState(() =>
        countPartiesPendingActions(),
    );

    useEffect(() => {
        if (isOffline) {
            const snapshot = loadPartiesSnapshot();

            if (snapshot) {
                setParties(snapshot);
            }

            return;
        }

        setParties(serverParties);
        persistPartiesSnapshot(serverParties);
    }, [isOffline, serverParties]);

    useEffect(() => {
        setPendingCount(countPartiesPendingActions());
    }, [parties]);

    const stats = useMemo(() => {
        if (!isOffline) {
            return serverStats;
        }

        return buildPartiesStats(parties);
    }, [isOffline, parties, serverStats]);

    const refreshPendingCount = useCallback(() => {
        setPendingCount(countPartiesPendingActions());
    }, []);

    const createOffline = useCallback(
        (payload: PartyFormPayload) => {
            setParties((current) => createPartyOffline(current, payload));
            refreshPendingCount();
        },
        [refreshPendingCount],
    );

    const updateOffline = useCallback(
        (partyId: string, payload: PartyFormPayload) => {
            setParties((current) =>
                updatePartyOffline(current, partyId, payload),
            );
            refreshPendingCount();
        },
        [refreshPendingCount],
    );

    const deleteOffline = useCallback(
        (partyId: string) => {
            setParties((current) => deletePartyOffline(current, partyId));
            refreshPendingCount();
        },
        [refreshPendingCount],
    );

    return {
        parties,
        stats,
        isOffline,
        pendingCount,
        createOffline,
        updateOffline,
        deleteOffline,
    };
}

export { PARTIES_RESOURCE };
