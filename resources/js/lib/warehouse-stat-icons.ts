import { CheckCircle2, Hash, ShoppingBag, Warehouse } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { WarehouseStatKey } from '@/types/admin/warehouses';

export const WAREHOUSE_STAT_ICONS: Record<WarehouseStatKey, LucideIcon> = {
    total: Warehouse,
    active: CheckCircle2,
    inactive: Hash,
    saleable: ShoppingBag,
};
