import type { StatBadgeItem } from '@/components/page-header';

export type UnitFormValues = {
    id: string;
    code: string;
    name: string;
    sunat_code: string;
    symbol: string;
    allows_decimals: boolean;
    is_active: boolean;
};

export type UnitRow = Omit<UnitFormValues, 'id'> & {
    id: string;
};

export type UnitStatKey = 'total' | 'active' | 'inactive' | 'decimals';

export type UnitStatItem = StatBadgeItem & {
    key: UnitStatKey;
};

export type UnitsOldForm = {
    code: string;
    name: string;
    sunat_code: string;
    symbol: string;
    allows_decimals: boolean;
    is_active: boolean;
};

export type UnitsIndexPageProps = {
    units: UnitRow[];
    stats: UnitStatItem[];
    unitModal?: 'create' | 'edit' | null;
    unitModalUnitId?: string | null;
    oldForm: UnitsOldForm;
};

export type UnitsPageErrors = Record<string, string>;
