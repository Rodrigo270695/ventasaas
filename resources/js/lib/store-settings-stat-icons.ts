import { CircleCheck, Percent, Receipt, Server } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StoreSettingsStatKey } from '@/types/admin/store-settings';

export const STORE_SETTINGS_STAT_ICONS: Record<StoreSettingsStatKey, LucideIcon> = {
    configured: CircleCheck,
    environment: Server,
    billing: Receipt,
    igv: Percent,
};
