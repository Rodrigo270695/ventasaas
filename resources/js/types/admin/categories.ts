import type { StatBadgeItem } from '@/components/page-header';
import type { FormSelectOption } from '@/components/form';

export type CategoryFormValues = {
    id: string;
    parent_id: string;
    code: string;
    name: string;
    is_active: boolean;
};

export type CategoryRow = {
    id: string;
    parent_id: string | null;
    parent_name: string | null;
    code: string;
    name: string;
    is_active: boolean;
    children_count: number;
};

export type CategoryStatKey = 'total' | 'active' | 'inactive' | 'with_parent';

export type CategoryStatItem = StatBadgeItem & {
    key: CategoryStatKey;
};

export type CategoriesOldForm = {
    parent_id: string;
    code: string;
    name: string;
    is_active: boolean;
};

export type CategoriesIndexPageProps = {
    categories: CategoryRow[];
    parentOptions: FormSelectOption[];
    stats: CategoryStatItem[];
    categoryModal?: 'create' | 'edit' | null;
    categoryModalCategoryId?: string | null;
    oldForm: CategoriesOldForm;
};

export type CategoriesPageErrors = Record<string, string>;
