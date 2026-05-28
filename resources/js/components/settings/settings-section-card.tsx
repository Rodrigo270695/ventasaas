import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    children: ReactNode;
    className?: string;
};

export function SettingsSectionCard({ children, className }: Props) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-[1.75rem] border border-violet-100 bg-white shadow-[0_16px_40px_-28px_rgba(76,29,149,0.35)]',
                className,
            )}
        >
            <div className="h-1 bg-linear-to-r from-[#ec4899] via-[#d946ef] to-[#7c3aed]" />
            <div className="p-6">{children}</div>
        </div>
    );
}
