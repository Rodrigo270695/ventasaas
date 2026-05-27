import { Shield, UserCheck, UserMinus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserStatKey } from '@/types/admin/users';

export const USER_STAT_ICONS: Record<UserStatKey, LucideIcon> = {
    total: Users,
    active: UserCheck,
    inactive: UserMinus,
    with_roles: Shield,
};
