import type { ReactNode } from 'react';
import {
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type Props = {
    title: string;
    description?: string;
    children?: ReactNode;
    className?: string;
};

export function AppModalHeader({
    title,
    description,
    children,
    className,
}: Props) {
    return (
        <DialogHeader
            className={cn(
                'shrink-0 border-b border-violet-100/80 bg-linear-to-r from-violet-50/80 to-fuchsia-50/50 px-6 py-4 text-left',
                className,
            )}
        >
            <DialogTitle className="text-lg font-bold text-[#4c1d95]">
                {title}
            </DialogTitle>
            {description ? (
                <DialogDescription className="text-sm font-normal text-[#7c6f8a]">
                    {description}
                </DialogDescription>
            ) : (
                <DialogDescription className="sr-only">
                    {title}
                </DialogDescription>
            )}
            {children}
        </DialogHeader>
    );
}
