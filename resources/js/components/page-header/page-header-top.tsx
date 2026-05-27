import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    children: ReactNode;
    className?: string;
};

/** Fila superior: título a la izquierda, acciones a la derecha. */
export function PageHeaderTop({ children, className }: Props) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
                className,
            )}
        >
            {children}
        </div>
    );
}
