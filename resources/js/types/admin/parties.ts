import type { StatBadgeItem } from '@/components/page-header';

export type PartyType = 'customer' | 'supplier' | 'both';

export type PartyFormValues = {
    id: string;
    type: PartyType;
    document_type: string;
    document_type_label: string;
    document_number: string;
    document_label: string;
    legal_name: string;
    trade_name: string | null;
    address: string | null;
    sunat_estado: string | null;
    sunat_condicion: string | null;
    email: string | null;
    phone: string | null;
    credit_limit: string;
    payment_term_days: number;
    is_active: boolean;
};

export type PartyRow = PartyFormValues;

export type PartyStatKey = 'total' | 'active' | 'customers' | 'suppliers';

export type PartyStatItem = StatBadgeItem & {
    key: PartyStatKey;
};

export type PartiesOldForm = {
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

export type PartiesIndexPageProps = {
    parties: PartyRow[];
    stats: PartyStatItem[];
    partyModal?: 'create' | 'edit' | null;
    partyModalId?: string | null;
    oldForm: PartiesOldForm;
};

export type PartiesPageErrors = Record<string, string>;
