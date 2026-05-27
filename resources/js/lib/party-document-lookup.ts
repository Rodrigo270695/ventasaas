import { consultaDocumento } from '@/routes/admin/socios';
import { notify } from '@/lib/notify';

export type PartyDocumentLookupResult = {
    document_number: string;
    legal_name: string;
    trade_name?: string | null;
    address?: string | null;
    ubigeo?: string | null;
    sunat_estado?: string | null;
    sunat_condicion?: string | null;
};

type LookupResponse = {
    success?: boolean;
    message?: string;
    data?: PartyDocumentLookupResult;
};

const DOC_RUC = '6';
const DOC_DNI = '1';

export function canLookupPartyDocument(documentType: string): boolean {
    return documentType === DOC_RUC || documentType === DOC_DNI;
}

export function partyDocumentLookupLabel(documentType: string): string {
    if (documentType === DOC_RUC) {
        return 'Consultar RUC';
    }

    if (documentType === DOC_DNI) {
        return 'Consultar DNI';
    }

    return 'Consultar';
}

export async function lookupPartyDocument(
    documentType: string,
    documentNumber: string,
): Promise<PartyDocumentLookupResult | null> {
    const digits = documentNumber.replace(/\D/g, '');

    if (documentType === DOC_RUC && digits.length !== 11) {
        notify.error('Ingresa un RUC válido de 11 dígitos.');

        return null;
    }

    if (documentType === DOC_DNI && digits.length !== 8) {
        notify.error('Ingresa un DNI válido de 8 dígitos.');

        return null;
    }

    if (!canLookupPartyDocument(documentType)) {
        notify.warning('La consulta automática solo está disponible para RUC y DNI.');

        return null;
    }

    const url = consultaDocumento.url({
        query: {
            document_type: documentType,
            document_number: digits,
        },
    });

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        });

        const body = (await res.json()) as LookupResponse;

        if (!res.ok || !body.success || !body.data) {
            notify.error(body.message ?? 'No se pudo consultar el documento.');

            return null;
        }

        notify.success('Datos cargados desde SUNAT/RENIEC.');

        return body.data;
    } catch {
        notify.error('No se pudo consultar el documento. Intente de nuevo.');

        return null;
    }
}
