import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    children: ReactNode;
    className?: string;
};

export function AppModalBody({ children, className }: Props) {
    return (
        <div
            className={cn(
                'min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5 [scrollbar-gutter:stable]',
                className,
            )}
        >
            {children}
        </div>
    );
}
