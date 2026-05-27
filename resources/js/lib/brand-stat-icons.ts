import { CheckCircle2, Hash, Tag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BrandStatKey } from '@/types/admin/brands';

export const BRAND_STAT_ICONS: Record<BrandStatKey, LucideIcon> = {
    total: Tag,
    active: CheckCircle2,
    inactive: Hash,
};
