import { CheckCircle2, Hash, Layers, Scale } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UnitStatKey } from '@/types/admin/units';

export const UNIT_STAT_ICONS: Record<UnitStatKey, LucideIcon> = {
    total: Layers,
    active: CheckCircle2,
    inactive: Hash,
    decimals: Scale,
};
