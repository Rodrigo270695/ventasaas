import type { LucideIcon } from 'lucide-react';

export type StatBadgeTone =
    | 'violet'
    | 'pink'
    | 'cyan'
    | 'amber'
    | 'green'
    | 'slate'
    | 'orange';

export type StatBadgeItem = {
    /** Identificador estable para iconos u otras extensiones */
    key?: string;
    label: string;
    value: number | string;
    tone?: StatBadgeTone;
    icon?: LucideIcon;
};
