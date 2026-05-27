import { Box, CheckCircle2, Package, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ProductStatKey } from '@/types/admin/products';

export const PRODUCT_STAT_ICONS: Record<ProductStatKey, LucideIcon> = {
    total: Package,
    active: CheckCircle2,
    goods: Box,
    services: Wrench,
};

export const PRODUCT_TYPE_LABELS: Record<'good' | 'service', string> = {
    good: 'Bien',
    service: 'Servicio',
};
