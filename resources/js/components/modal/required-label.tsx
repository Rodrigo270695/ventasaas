import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Props = {
    htmlFor: string;
    children: ReactNode;
    className?: string;
};

export function RequiredLabel({ htmlFor, children, className }: Props) {
    return (
        <Label htmlFor={htmlFor} className={cn(className)}>
            {children}{' '}
            <span className="font-bold text-red-600" aria-hidden="true">
                *
            </span>
            <span className="sr-only"> (obligatorio)</span>
        </Label>
    );
}
