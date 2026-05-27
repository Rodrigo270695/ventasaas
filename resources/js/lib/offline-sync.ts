import { router } from '@inertiajs/react';
import { notify } from '@/lib/notify';
import {
    OFFLINE_ID_PLACEHOLDER,
    resolveSyncEndpoint,
} from '@/lib/offline-quick-sale';
import {
    listPendingActions,
    removePendingAction,
    type OfflinePendingAction,
} from '@/lib/offline-store';

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

function extractDocumentIdFromLocation(location: string | null): string | null {
    if (!location) {
        return null;
    }

    const patterns = [
        /tickets-internos\/([0-9a-f-]{36})(?:\/edit|\/confirmar)?/i,
        /cotizaciones\/([0-9a-f-]{36})(?:\/edit)?/i,
        /productos\/([0-9a-f-]{36})(?:\/edit)?/i,
    ];

    for (const pattern of patterns) {
        const match = location.match(pattern);

        if (match?.[1]) {
            return match[1];
        }
    }

    return null;
}

function appendPayloadValue(
    formData: FormData,
    key: string,
    value: OfflinePendingAction['payload'][string],
): void {
    if (value === null || value === undefined) {
        return;
    }

    if (Array.isArray(value)) {
        value.forEach((item, index) => {
            if (item && typeof item === 'object') {
                Object.entries(item).forEach(([lineKey, lineValue]) => {
                    appendPayloadValue(
                        formData,
                        `${key}[${index}][${lineKey}]`,
                        lineValue as OfflinePendingAction['payload'][string],
                    );
                });
            }
        });

        return;
    }

    if (typeof value === 'object') {
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            appendPayloadValue(
                formData,
                `${key}[${nestedKey}]`,
                nestedValue as OfflinePendingAction['payload'][string],
            );
        });

        return;
    }

    if (typeof value === 'boolean') {
        formData.append(key, value ? '1' : '0');

        return;
    }

    formData.append(key, String(value));
}

async function submitPendingAction(
    action: OfflinePendingAction,
    localToServerId: Map<string, string>,
): Promise<{ ok: boolean; serverId?: string }> {
    let endpoint = action.endpoint;

    if (action.localEntityId) {
        const serverId = localToServerId.get(action.localEntityId);

        if (endpoint.includes(OFFLINE_ID_PLACEHOLDER) && !serverId) {
            return { ok: false };
        }

        if (serverId) {
            endpoint = resolveSyncEndpoint(
                endpoint,
                action.localEntityId,
                serverId,
            );
        }
    }

    const formData = new FormData();

    Object.entries(action.payload).forEach(([key, value]) => {
        appendPayloadValue(formData, key, value);
    });

    let method: 'POST' | 'DELETE' = 'POST';

    if (action.method === 'DELETE') {
        formData.append('_method', 'DELETE');
    } else if (action.method === 'PUT' || action.method === 'PATCH') {
        formData.append('_method', action.method);
    }

    const response = await fetch(endpoint, {
        method,
        body: formData,
        credentials: 'same-origin',
        redirect: 'manual',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': getCsrfToken(),
        },
    });

    const ok =
        response.ok ||
        response.status === 302 ||
        response.status === 303 ||
        response.redirected;

    if (!ok) {
        return { ok: false };
    }

    const location = response.headers.get('Location');
    const serverId =
        extractDocumentIdFromLocation(location) ??
        (action.localEntityId && !endpoint.includes(OFFLINE_ID_PLACEHOLDER)
            ? extractDocumentIdFromLocation(endpoint)
            : null);

    return { ok: true, serverId: serverId ?? undefined };
}

let syncing = false;

export async function syncPendingActions(options?: {
    resource?: string;
    reload?: boolean;
}): Promise<number> {
    if (syncing || !navigator.onLine) {
        return 0;
    }

    syncing = true;
    let synced = 0;
    const localToServerId = new Map<string, string>();

    try {
        let queue = listPendingActions(options?.resource);
        let progress = true;

        while (progress && queue.length > 0) {
            progress = false;

            for (const action of queue) {
                if (action.dependsOn) {
                    const dependencyDone = !listPendingActions(
                        options?.resource,
                    ).some((item) => item.id === action.dependsOn);

                    if (!dependencyDone) {
                        continue;
                    }
                }

                try {
                    const result = await submitPendingAction(
                        action,
                        localToServerId,
                    );

                    if (!result.ok) {
                        continue;
                    }

                    if (result.serverId && action.localEntityId) {
                        localToServerId.set(
                            action.localEntityId,
                            result.serverId,
                        );
                    }

                    removePendingAction(action.id);
                    synced += 1;
                    progress = true;
                } catch {
                    // Mantener en cola para reintento posterior.
                }
            }

            queue = listPendingActions(options?.resource);
        }

        if (synced > 0) {
            notify.success(
                synced === 1
                    ? '1 cambio sincronizado'
                    : `${synced} cambios sincronizados`,
            );

            if (options?.reload !== false) {
                router.reload({ preserveScroll: true });
            }
        }
    } finally {
        syncing = false;
    }

    return synced;
}

export function isOfflineSyncRunning(): boolean {
    return syncing;
}
