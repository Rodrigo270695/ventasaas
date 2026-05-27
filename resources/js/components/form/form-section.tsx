import type { ReactNode } from 'react';
import { chokoSectionTitleClass } from '@/components/form/field-styles';
import { cn } from '@/lib/utils';

type Props = {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    gridClassName?: string;
};

export function FormSection({
    title,
    description,
    children,
    className,
    gridClassName = 'grid gap-3 sm:grid-cols-2',
}: Props) {
    return (
        <section className={cn('space-y-3', className)}>
            <div>
                <h3 className={chokoSectionTitleClass}>{title}</h3>
                {description && (
                    <p className="mt-1 text-[11px] text-[#7c6f8a]">{description}</p>
                )}
            </div>
            <div className={gridClassName}>{children}</div>
        </section>
    );
}
