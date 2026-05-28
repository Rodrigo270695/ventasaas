import type { StatBadgeItem } from '@/components/page-header';

export type StoreCoverStatKey = 'total' | 'active' | 'inactive';

export type StoreCoverStatItem = StatBadgeItem & {
    key: StoreCoverStatKey;
};

export type StoreCoverSlideRow = {
    id: string;
    title: string | null;
    subtitle: string | null;
    image_url: string | null;
    sort_order: number;
    is_active: boolean;
    updated_at: string | null;
};

export type StoreCoverFormValues = {
    id?: string;
    title: string;
    subtitle: string;
    is_active: boolean;
};

export type StoreCoversOldForm = {
    title: string;
    subtitle: string;
    is_active: boolean;
};

export type StoreCoversIndexPageProps = {
    slides: StoreCoverSlideRow[];
    stats: StoreCoverStatItem[];
    coverModal?: 'create' | 'edit' | null;
    coverModalSlideId?: string | null;
    oldForm?: StoreCoversOldForm;
};

export type StoreCoversPageErrors = Record<string, string>;
