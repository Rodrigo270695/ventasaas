import type { StatBadgeItem } from '@/components/page-header';

export type RoleOption = {
    id: number;
    name: string;
};

export type UserFormValues = {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
};

export type UserRow = UserFormValues & {
    role_names: string[];
    role_ids: number[];
};

export type UserStatKey = 'total' | 'active' | 'inactive' | 'with_roles';

export type UserStatItem = StatBadgeItem & {
    key: UserStatKey;
};

export type UsersOldForm = {
    name: string;
    email: string;
    is_active: boolean;
};

export type UsersIndexPageProps = {
    users: UserRow[];
    stats: UserStatItem[];
    rolesCatalog: RoleOption[] | null;
    userModal?: 'create' | 'edit' | null;
    userModalUserId?: number | null;
    oldForm: UsersOldForm;
};

export type UsersPageErrors = Record<string, string>;
