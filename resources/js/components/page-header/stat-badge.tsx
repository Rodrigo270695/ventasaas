import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StatBadgeTone } from '@/components/page-header/types';

const toneStyles: Record<
    StatBadgeTone,
    { wrap: string; icon: string; value: string }
> = {
    violet: {
        wrap: 'border-violet-200/80 bg-violet-50 text-violet-900',
        icon: 'text-violet-500',
        value: 'text-violet-800',
    },
    pink: {
        wrap: 'border-fuchsia-200/80 bg-fuchsia-50 text-fuchsia-900',
        icon: 'text-fuchsia-500',
        value: 'text-fuchsia-800',
    },
    cyan: {
        wrap: 'border-cyan-200/80 bg-cyan-50 text-cyan-900',
        icon: 'text-cyan-600',
        value: 'text-cyan-800',
    },
    amber: {
        wrap: 'border-amber-200/80 bg-amber-50 text-amber-900',
        icon: 'text-amber-600',
        value: 'text-amber-900',
    },
    green: {
        wrap: 'border-emerald-200/80 bg-emerald-50 text-emerald-900',
        icon: 'text-emerald-600',
        value: 'text-emerald-800',
    },
    slate: {
        wrap: 'border-slate-200/80 bg-slate-50 text-slate-800',
        icon: 'text-slate-500',
        value: 'text-slate-700',
    },
    orange: {
        wrap: 'border-orange-200/80 bg-orange-50 text-orange-900',
        icon: 'text-orange-500',
        value: 'text-orange-800',
    },
};

type Props = {
    label: string;
    value: number | string;
    tone?: StatBadgeTone;
    icon?: LucideIcon;
    className?: string;
    active?: boolean;
    onClick?: () => void;
};

export function StatBadge({
    label,
    value,
    tone = 'violet',
    icon: Icon,
    className,
    active = false,
    onClick,
}: Props) {
    const styles = toneStyles[tone];
    const interactive = typeof onClick === 'function';

    const content = (
        <>
            {Icon && <Icon className={cn('size-3.5 shrink-0', styles.icon)} />}
            <span>{label}</span>
            <span className={cn('font-bold tabular-nums', styles.value)}>
                {value}
            </span>
        </>
    );

    const classes = cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm',
        styles.wrap,
        interactive &&
            'cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60',
        active && 'ring-2 ring-[#7c3aed]/50 ring-offset-1',
        className,
    );

    if (interactive) {
        return (
            <button type="button" onClick={onClick} className={classes}>
                {content}
            </button>
        );
    }

    return <span className={classes}>{content}</span>;
}
