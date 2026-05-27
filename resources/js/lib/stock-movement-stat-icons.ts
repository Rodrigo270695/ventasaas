import { ArrowDownToLine, ArrowUpFromLine, History, PackagePlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StockMovementStatKey } from '@/types/admin/stock-movements';

export const STOCK_MOVEMENT_STAT_ICONS: Record<StockMovementStatKey, LucideIcon> = {
    total: History,
    entries: PackagePlus,
    exits: ArrowUpFromLine,
    inbound: ArrowDownToLine,
};
