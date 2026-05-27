import type { RoleFormValues } from '@/components/admin/sistema/role-form-modal';
import type { StatBadgeItem } from '@/components/page-header';

export type PermissionGroup = {
    key: string;
    section: string | null;
    label: string;
    implemented: boolean;
    permissions: Array<{ name: string; label: string }>;
};

export type RoleRow = RoleFormValues & {
    permissions_count: number;
    users_count: number;
    permission_names: string[];
};

export type RoleStatKey =
    | 'total'
    | 'with_permissions'
    | 'without_permissions'
    | 'users_with_role'
    | 'roles_with_users';

export type RoleStatItem = StatBadgeItem & {
    key: RoleStatKey;
};

export type RolesIndexPageProps = {
    roles: RoleRow[];
    stats: RoleStatItem[];
    permissionCatalog: PermissionGroup[] | null;
    roleModal?: 'create' | 'edit' | null;
    roleModalRoleId?: number | null;
    oldName?: string;
};

export type RolesPageErrors = Record<string, string>;
