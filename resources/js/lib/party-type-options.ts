import type { FormSelectOption } from '@/components/form';

export const PARTY_TYPE_OPTIONS: FormSelectOption[] = [
    { value: 'customer', label: 'Cliente' },
    { value: 'supplier', label: 'Proveedor' },
    { value: 'both', label: 'Cliente y proveedor' },
];

export function partyTypeLabel(value: string): string {
    return PARTY_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
