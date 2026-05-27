import type { FormSelectOption } from '@/components/form';

/** Catálogo SUNAT — tipo de documento de identidad. */
export const PARTY_DOCUMENT_TYPE_OPTIONS: FormSelectOption[] = [
    { value: '6', label: 'RUC' },
    { value: '1', label: 'DNI' },
    { value: '4', label: 'Carnet de extranjería' },
    { value: '7', label: 'Pasaporte' },
    { value: '0', label: 'Otros' },
];

export const PARTY_DOC_DNI = '1';

export const PARTY_DOC_RUC = '6';

/** Longitud fija SUNAT para DNI (8) o RUC (11); null si no aplica. */
export function partyDocumentFixedLength(documentType: string): number | null {
    if (documentType === PARTY_DOC_DNI) {
        return 8;
    }

    if (documentType === PARTY_DOC_RUC) {
        return 11;
    }

    return null;
}

export function partyDocumentIsComplete(
    documentType: string,
    documentNumber: string,
): boolean {
    const fixed = partyDocumentFixedLength(documentType);

    if (fixed === null) {
        return documentNumber.trim().length > 0;
    }

    return documentNumber.length === fixed;
}

export function sanitizePartyDocumentNumber(
    documentType: string,
    value: string,
): string {
    const trimmed = value.replace(/\s/g, '');
    const fixed = partyDocumentFixedLength(documentType);

    if (fixed === null) {
        return trimmed.slice(0, 15);
    }

    return trimmed.replace(/\D/g, '').slice(0, fixed);
}

export function partyDocumentTypeLabel(value: string): string {
    return (
        PARTY_DOCUMENT_TYPE_OPTIONS.find((option) => option.value === value)
            ?.label ?? value
    );
}
