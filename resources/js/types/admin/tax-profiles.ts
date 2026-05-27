import type { FormSelectOption } from '@/components/form';
import type { StatBadgeItem } from '@/components/page-header';

export type TaxProfileFormValues = {
    id: string;
    code: string;
    name: string;
    sunat_affectation_code: string;
    igv_rate: string;
    isc_rate: string | null;
    is_default: boolean;
    is_active: boolean;
    sort_order: number;
};

export type TaxProfileRow = TaxProfileFormValues & {
    sunat_affectation_name: string | null;
    assignments_count: number;
};

export type SunatAffectationOption = FormSelectOption & {
    default_igv_rate: string;
};

export type TaxProfileStatKey = 'total' | 'active' | 'assignments';

export type TaxProfileStatItem = StatBadgeItem & {
    key: TaxProfileStatKey;
};

export type TaxProfilesOldForm = {
    code: string;
    name: string;
    sunat_affectation_code: string;
    igv_rate: string;
    isc_rate: string;
    is_default: boolean;
    is_active: boolean;
    sort_order: number;
};

export type TaxProfilesIndexPageProps = {
    taxProfiles: TaxProfileRow[];
    affectationOptions: SunatAffectationOption[];
    stats: TaxProfileStatItem[];
    taxProfileModal?: 'create' | 'edit' | null;
    taxProfileModalId?: string | null;
    oldForm: TaxProfilesOldForm;
};

export type TaxProfilesPageErrors = Record<string, string>;
