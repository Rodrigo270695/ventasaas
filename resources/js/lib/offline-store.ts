type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };

export type OfflinePendingAction = {
    id: string;
    resource: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint: string;
    payload: Record<string, JsonValue>;
    /** ID local temporal vinculado (creaciones offline). */
    localEntityId?: string;
    /** Acción que debe sincronizarse antes (p. ej. confirmar tras crear borrador). */
    dependsOn?: string;
    createdAt: string;
};

export type CollectionSnapshot<T = JsonValue> = {
    cachedAt: string;
    items: T[];
    meta: Record<string, JsonValue>;
};

const OFFLINE_CACHE_PREFIX = 'offline-cache:';
const OFFLINE_QUEUE_KEY = 'offline:pending-actions';

function readJson<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) {
            return fallback;
        }

        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function writeJson<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignorar errores de cuota o contexto no disponible.
    }
}

export function cacheCollectionSnapshot(
    key: string,
    items: JsonValue[],
    meta: Record<string, JsonValue> = {},
): void {
    writeJson(`${OFFLINE_CACHE_PREFIX}${key}`, {
        cachedAt: new Date().toISOString(),
        items,
        meta,
    });
}

export function getCollectionSnapshot<T = JsonValue>(
    key: string,
): CollectionSnapshot<T> | null {
    return readJson(`${OFFLINE_CACHE_PREFIX}${key}`, null);
}

export function updateCollectionSnapshot<T extends JsonValue>(
    key: string,
    items: T[],
): void {
    const current = getCollectionSnapshot<T>(key);
    cacheCollectionSnapshot(key, items, current?.meta ?? {});
}

export function generateOfflineId(): string {
    return `offline-${crypto.randomUUID()}`;
}

export function isOfflineEntityId(id: string): boolean {
    return id.startsWith('offline-');
}

export function enqueuePendingAction(
    action: Omit<OfflinePendingAction, 'id' | 'createdAt'>,
): OfflinePendingAction {
    const queue = readJson<OfflinePendingAction[]>(OFFLINE_QUEUE_KEY, []);
    const item: OfflinePendingAction = {
        ...action,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
    };

    queue.push(item);
    writeJson(OFFLINE_QUEUE_KEY, queue);

    return item;
}

export function listPendingActions(resource?: string): OfflinePendingAction[] {
    const queue = readJson<OfflinePendingAction[]>(OFFLINE_QUEUE_KEY, []);

    if (!resource) {
        return queue;
    }

    return queue.filter((item) => item.resource === resource);
}

export function removePendingAction(actionId: string): void {
    const queue = readJson<OfflinePendingAction[]>(OFFLINE_QUEUE_KEY, []);
    writeJson(
        OFFLINE_QUEUE_KEY,
        queue.filter((item) => item.id !== actionId),
    );
}

export function removePendingActionsByLocalEntity(localEntityId: string): void {
    const queue = readJson<OfflinePendingAction[]>(OFFLINE_QUEUE_KEY, []);
    writeJson(
        OFFLINE_QUEUE_KEY,
        queue.filter((item) => item.localEntityId !== localEntityId),
    );
}

export function updatePendingCreatePayload(
    localEntityId: string,
    payload: Record<string, JsonValue>,
): boolean {
    const queue = readJson<OfflinePendingAction[]>(OFFLINE_QUEUE_KEY, []);
    let updated = false;

    const next = queue.map((item) => {
        if (item.localEntityId !== localEntityId || item.method !== 'POST') {
            return item;
        }

        updated = true;

        return { ...item, payload };
    });

    if (updated) {
        writeJson(OFFLINE_QUEUE_KEY, next);
    }

    return updated;
}

export function countPendingActions(resource?: string): number {
    return listPendingActions(resource).length;
}
