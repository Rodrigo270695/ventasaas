import type { ReactNode } from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type Props = {
    children: ReactNode;
    className?: string;
};

export function AppModalFooter({ children, className }: Props) {
    return (
        <DialogFooter
            className={cn(
                'shrink-0 border-t border-violet-100/80 bg-violet-50/30 px-6 py-4 sm:justify-end',
                className,
            )}
        >
            {children}
        </DialogFooter>
    );
}
