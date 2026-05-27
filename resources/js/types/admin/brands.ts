import type { StatBadgeItem } from '@/components/page-header';

export type BrandFormValues = {
    id: string;
    code: string;
    name: string;
    is_active: boolean;
};

export type BrandRow = BrandFormValues;

export type BrandStatKey = 'total' | 'active' | 'inactive';

export type BrandStatItem = StatBadgeItem & {
    key: BrandStatKey;
};

export type BrandsOldForm = {
    code: string;
    name: string;
    is_active: boolean;
};

export type BrandsIndexPageProps = {
    brands: BrandRow[];
    stats: BrandStatItem[];
    brandModal?: 'create' | 'edit' | null;
    brandModalBrandId?: string | null;
    oldForm: BrandsOldForm;
};

export type BrandsPageErrors = Record<string, string>;
