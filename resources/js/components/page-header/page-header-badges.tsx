import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    children: ReactNode;
    className?: string;
};

export function PageHeaderBadges({ children, className }: Props) {
    return (
        <div
            data-tour="page-stats"
            className={cn(
                'flex flex-wrap items-center gap-2',
                className,
            )}
        >
            {children}
        </div>
    );
}
