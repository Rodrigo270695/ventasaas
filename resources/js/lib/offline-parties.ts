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
import {
    loadQuotationFormSnapshot,
    persistQuotationFormSnapshot,
} from '@/lib/offline-quotations';
import {
    PARTY_DOCUMENT_TYPE_OPTIONS,
} from '@/lib/party-document-type-options';
import { destroy, store, update } from '@/routes/admin/socios';
import type { PartyRow, PartyStatItem, PartyType } from '@/types/admin/parties';

export const PARTIES_CACHE_KEY = 'socios.parties';
export const PARTIES_RESOURCE = 'parties';

export type PartyFormPayload = {
    type: PartyType;
    document_type: string;
    document_number: string;
    legal_name: string;
    trade_name: string;
    address: string;
    sunat_estado: string;
    sunat_condicion: string;
    email: string;
    phone: string;
    credit_limit: string;
    payment_term_days: number;
    is_active: boolean;
};

function documentTypeLabel(documentType: string): string {
    return (
        PARTY_DOCUMENT_TYPE_OPTIONS.find(
            (option) => option.value === documentType,
        )?.label ?? 'Doc.'
    );
}

function buildDocumentLabel(documentType: string, documentNumber: string): string {
    return `${documentTypeLabel(documentType)} ${documentNumber.trim()}`;
}

function buildPayloadBody(payload: PartyFormPayload) {
    return {
        type: payload.type,
        document_type: payload.document_type,
        document_number: payload.document_number.trim(),
        legal_name: payload.legal_name.trim(),
        trade_name: payload.trade_name.trim(),
        address: payload.address.trim(),
        sunat_estado: payload.sunat_estado.trim(),
        sunat_condicion: payload.sunat_condicion.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
        credit_limit: payload.credit_limit.trim(),
        payment_term_days: payload.payment_term_days,
        is_active: payload.is_active,
    };
}

function buildPartyRow(localId: string, payload: PartyFormPayload): PartyRow {
    const body = buildPayloadBody(payload);

    return {
        id: localId,
        type: body.type,
        document_type: body.document_type,
        document_type_label: documentTypeLabel(body.document_type),
        document_number: body.document_number,
        document_label: buildDocumentLabel(body.document_type, body.document_number),
        legal_name: body.legal_name,
        trade_name: body.trade_name || null,
        address: body.address || null,
        sunat_estado: body.sunat_estado || null,
        sunat_condicion: body.sunat_condicion || null,
        email: body.email || null,
        phone: body.phone || null,
        credit_limit: body.credit_limit,
        payment_term_days: body.payment_term_days,
        is_active: body.is_active,
    };
}

function recalcStats(parties: PartyRow[]): PartyStatItem[] {
    const activeCount = parties.filter((row) => row.is_active).length;
    const customers = parties.filter(
        (row) => row.type === 'customer' || row.type === 'both',
    ).length;
    const suppliers = parties.filter(
        (row) => row.type === 'supplier' || row.type === 'both',
    ).length;

    return [
        {
            key: 'total',
            label: 'Total',
            value: parties.length,
            tone: 'violet',
        },
        {
            key: 'active',
            label: 'Activos',
            value: activeCount,
            tone: 'green',
        },
        {
            key: 'customers',
            label: 'Clientes',
            value: customers,
            tone: 'cyan',
        },
        {
            key: 'suppliers',
            label: 'Proveedores',
            value: suppliers,
            tone: 'amber',
        },
    ];
}

function appendPartyToQuotationLookups(party: PartyRow): void {
    const snapshot = loadQuotationFormSnapshot();

    if (!snapshot) {
        return;
    }

    const exists = snapshot.customerOptions.some(
        (option) => option.value === party.id,
    );

    if (exists) {
        return;
    }

    persistQuotationFormSnapshot({
        ...snapshot,
        customerOptions: [
            ...snapshot.customerOptions,
            {
                value: party.id,
                label: party.legal_name,
                sublabel: party.document_label,
                email: party.email,
            },
        ],
    });
}

export function persistPartiesSnapshot(parties: PartyRow[]): void {
    cacheCollectionSnapshot(PARTIES_CACHE_KEY, parties, {});
}

export function loadPartiesSnapshot(): PartyRow[] | null {
    const snapshot = getCollectionSnapshot<PartyRow>(PARTIES_CACHE_KEY);

    return snapshot?.items ?? null;
}

export function createPartyOffline(
    parties: PartyRow[],
    payload: PartyFormPayload,
): PartyRow[] {
    const localId = generateOfflineId();
    const body = buildPayloadBody(payload);
    const nextRow = buildPartyRow(localId, payload);
    const next = [...parties, nextRow];

    enqueuePendingAction({
        resource: PARTIES_RESOURCE,
        method: 'POST',
        endpoint: store.url(),
        localEntityId: localId,
        payload: body,
    });

    persistPartiesSnapshot(next);
    appendPartyToQuotationLookups(nextRow);

    return next;
}

export function updatePartyOffline(
    parties: PartyRow[],
    partyId: string,
    payload: PartyFormPayload,
): PartyRow[] {
    const body = buildPayloadBody(payload);

    const next = parties.map((row) => {
        if (row.id !== partyId) {
            return row;
        }

        return buildPartyRow(partyId, payload);
    });

    if (isOfflineEntityId(partyId)) {
        updatePendingCreatePayload(partyId, body);
    } else {
        enqueuePendingAction({
            resource: PARTIES_RESOURCE,
            method: 'PUT',
            endpoint: update.url(partyId),
            payload: body,
        });
    }

    persistPartiesSnapshot(next);

    const updated = next.find((row) => row.id === partyId);

    if (updated) {
        appendPartyToQuotationLookups(updated);
    }

    return next;
}

export function deletePartyOffline(
    parties: PartyRow[],
    partyId: string,
): PartyRow[] {
    const next = parties.filter((row) => row.id !== partyId);

    if (isOfflineEntityId(partyId)) {
        removePendingActionsByLocalEntity(partyId);
    } else {
        enqueuePendingAction({
            resource: PARTIES_RESOURCE,
            method: 'DELETE',
            endpoint: destroy.url(partyId),
            payload: {},
        });
    }

    persistPartiesSnapshot(next);

    return next;
}

export function buildPartiesStats(parties: PartyRow[]): PartyStatItem[] {
    return recalcStats(parties);
}

export function countPartiesPendingActions(): number {
    return countPendingActions(PARTIES_RESOURCE);
}
