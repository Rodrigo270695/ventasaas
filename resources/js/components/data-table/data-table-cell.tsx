import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    children: ReactNode;
    truncate?: boolean;
    title?: string;
    className?: string;
};

export function DataTableCell({
    children,
    truncate = false,
    title,
    className,
}: Props) {
    if (!truncate) {
        return <>{children}</>;
    }

    const label =
        title ?? (typeof children === 'string' ? children : undefined);

    return (
        <span
            className={cn(
                'block min-w-0 max-w-[10rem] truncate sm:max-w-[12rem] lg:max-w-[14rem]',
                className,
            )}
            title={label}
        >
            {children}
        </span>
    );
}
