import { KeyRound, Shield, UserCheck, Users, UserX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RoleStatKey } from '@/types/admin/roles';

export const ROLE_STAT_ICONS: Record<RoleStatKey, LucideIcon> = {
    total: Shield,
    with_permissions: KeyRound,
    without_permissions: UserX,
    users_with_role: Users,
    roles_with_users: UserCheck,
};
