import type { FormSelectOption } from '@/components/form';

/** Tipos de comprobante SUNAT (códigos de catálogo 01, 03, …). */
export const SUNAT_DOCUMENT_TYPE_OPTIONS: FormSelectOption[] = [
    { value: '01', label: '01 — Factura' },
    { value: '03', label: '03 — Boleta' },
    { value: '07', label: '07 — Nota de crédito' },
    { value: '08', label: '08 — Nota de débito' },
    { value: '09', label: '09 — Guía de remisión' },
];

export function sunatDocumentTypeLabel(code: string): string {
    return (
        SUNAT_DOCUMENT_TYPE_OPTIONS.find((option) => option.value === code)
            ?.label ?? code
    );
}
