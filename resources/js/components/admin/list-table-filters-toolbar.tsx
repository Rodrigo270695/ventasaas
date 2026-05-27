import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    children: ReactNode;
    className?: string;
};

/** Agrupa filtros de toolbar (fechas, estado, etc.) en una fila alineada. */
export function ListTableFiltersToolbar({ children, className }: Props) {
    return (
        <div
            className={cn(
                'flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end',
                className,
            )}
        >
            {children}
        </div>
    );
}
