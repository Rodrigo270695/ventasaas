import { Building2, CheckCircle2, Truck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PartyStatKey } from '@/types/admin/parties';

export const PARTY_STAT_ICONS: Record<PartyStatKey, LucideIcon> = {
    total: Users,
    active: CheckCircle2,
    customers: Building2,
    suppliers: Truck,
};
