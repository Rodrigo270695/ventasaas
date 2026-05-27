import { CheckCircle2, Layers, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const PAYMENT_METHOD_STAT_ICONS: Record<string, LucideIcon> = {
    total: Layers,
    active: CheckCircle2,
    inactive: XCircle,
};
