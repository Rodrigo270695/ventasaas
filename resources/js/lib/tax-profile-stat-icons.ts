import { CheckCircle2, FileCheck2, Receipt } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TaxProfileStatKey } from '@/types/admin/tax-profiles';

export const TAX_PROFILE_STAT_ICONS: Record<TaxProfileStatKey, LucideIcon> = {
    total: Receipt,
    active: CheckCircle2,
    assignments: FileCheck2,
};
