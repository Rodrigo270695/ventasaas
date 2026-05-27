import type { StatBadgeItem } from '@/components/page-header';

export type PriceListFormValues = {
    id: string;
    code: string;
    name: string;
    currency_code: string;
    is_default: boolean;
    is_active: boolean;
    sort_order: number;
};

export type PriceListRow = PriceListFormValues & {
    prices_count: number;
};

export type PriceListStatKey = 'total' | 'active' | 'prices';

export type PriceListStatItem = StatBadgeItem & {
    key: PriceListStatKey;
};

export type PriceListsOldForm = {
    code: string;
    name: string;
    currency_code: string;
    is_default: boolean;
    is_active: boolean;
    sort_order: number;
};

export type PriceListsIndexPageProps = {
    priceLists: PriceListRow[];
    stats: PriceListStatItem[];
    priceListModal?: 'create' | 'edit' | null;
    priceListModalId?: string | null;
    oldForm: PriceListsOldForm;
};

export type PriceListsPageErrors = Record<string, string>;
