import { CheckCircle2, DoorOpen, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const CASH_REGISTER_STAT_ICONS: Record<string, LucideIcon> = {
    total: Layers,
    active: CheckCircle2,
    open: DoorOpen,
};
