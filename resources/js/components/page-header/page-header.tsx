import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    children: ReactNode;
    className?: string;
};

/**
 * Contenedor padre del encabezado de página (título, acciones, badges).
 *
 * @example
 * <PageHeader>
 *   <PageHeaderTop>
 *     <PageHeaderTitle title="Roles" description="..." />
 *     <PageHeaderActions>
 *       <PageHeaderNewButton href="..." label="Nuevo rol" />
 *     </PageHeaderActions>
 *   </PageHeaderTop>
 *   <PageHeaderBadges>
 *     <StatBadge label="Total" value={4} />
 *   </PageHeaderBadges>
 * </PageHeader>
 */
export function PageHeader({ children, className }: Props) {
    return (
        <header
            data-tour="page-header"
            className={cn(
                'mb-6 space-y-4 border-b border-violet-100/80 pb-6',
                className,
            )}
        >
            {children}
        </header>
    );
}
