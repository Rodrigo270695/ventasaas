export const TAX_REGIME_OPTIONS = [
    {
        value: 'mype',
        label: 'Régimen MYPE Tributario (RMT)',
    },
    {
        value: 'special',
        label: 'Régimen Especial del I.R. (RER)',
    },
    { value: 'general', label: 'Régimen general' },
    { value: 'nrus', label: 'Nuevo RUS (NRUS)' },
] as const;

export const BILLING_CHANNEL_OPTIONS = [
    { value: 'direct_sunat', label: 'SUNAT directo (SEE)' },
    { value: 'pse', label: 'PSE' },
    { value: 'ose', label: 'OSE' },
] as const;

export const SUNAT_ENVIRONMENT_OPTIONS = [
    { value: 'beta', label: 'Beta (solo pruebas SUNAT)' },
    { value: 'production', label: 'Producción (emisión real)' },
] as const;

export function labelForTaxRegime(value: string): string {
    return TAX_REGIME_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function labelForBillingChannel(value: string): string {
    return BILLING_CHANNEL_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function labelForSunatEnvironment(value: string): string {
    return SUNAT_ENVIRONMENT_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
