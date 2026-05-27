import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    children: ReactNode;
    className?: string;
};

export function PageHeaderActions({ children, className }: Props) {
    return (
        <div
            className={cn(
                'flex shrink-0 items-center gap-2 sm:pt-0.5',
                className,
            )}
        >
            {children}
        </div>
    );
}
