import { CheckCircle2, Coins, Tags } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PriceListStatKey } from '@/types/admin/price-lists';

export const PRICE_LIST_STAT_ICONS: Record<PriceListStatKey, LucideIcon> = {
    total: Tags,
    active: CheckCircle2,
    prices: Coins,
};
