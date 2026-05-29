import { AlertTriangle, Boxes, CalendarClock, CircleDollarSign, PackageCheck, PackageX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StockBalanceStatKey } from '@/types/admin/stock-balances';

export const STOCK_BALANCE_STAT_ICONS: Record<StockBalanceStatKey, LucideIcon> = {
    skus: Boxes,
    with_stock: PackageCheck,
    zero: PackageX,
    low: AlertTriangle,
    expiring: CalendarClock,
    expired: AlertTriangle,
    value: CircleDollarSign,
};
