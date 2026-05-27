import type { StatBadgeItem } from '@/components/page-header';

export type StoreSettingsStatKey =
    | 'configured'
    | 'environment'
    | 'billing'
    | 'igv';

export type StoreSettingsStatItem = StatBadgeItem & {
    key: StoreSettingsStatKey;
};

export type StoreSettingsRow = {
    id: string;
    ruc: string;
    razon_social: string;
    ubigeo: string;
    direccion: string | null;
    tax_regime: string;
    billing_channel: string;
    sunat_environment: string;
    default_igv_rate: number;
    has_certificate: boolean;
    has_certificate_password: boolean;
    certificate_name: string | null;
    sol_user: string | null;
    has_sol_password: boolean;
    has_api_token: boolean;
    updated_at: string | null;
};

export type StoreSettingsFormValues = {
    ruc: string;
    razon_social: string;
    ubigeo: string;
    direccion: string;
    tax_regime: string;
    billing_channel: string;
    sunat_environment: string;
    default_igv_rate: string;
    cdt_password_enc: string;
    sol_user: string;
    sol_password_enc: string;
    apisunat_token_enc: string;
};

export type TiendaIndexPageProps = {
    settings: StoreSettingsRow | null;
    stats: StoreSettingsStatItem[];
    storeSettingsModal?: boolean;
    oldForm: StoreSettingsFormValues;
};

export type StoreSettingsPageErrors = Record<string, string>;
