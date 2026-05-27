import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonClassName = cn(
    'inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5',
    'bg-linear-to-r from-[#5b21b6] to-[#7c3aed]',
    'text-sm font-bold text-white shadow-md shadow-violet-300/40',
    'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-300/50',
    'active:translate-y-0 active:scale-[0.98]',
);

type Props = {
    label: string;
    className?: string;
    href?: NonNullable<InertiaLinkProps['href']>;
    onClick?: () => void;
};

export function PageHeaderNewButton({
    href,
    onClick,
    label,
    className,
}: Props) {
    if (onClick) {
        return (
            <button
                type="button"
                data-tour="page-new"
                onClick={onClick}
                className={cn(buttonClassName, className)}
            >
                <Plus className="size-4" strokeWidth={2.5} />
                {label}
            </button>
        );
    }

    if (!href) {
        return null;
    }

    return (
        <Link
            href={href}
            prefetch
            data-tour="page-new"
            className={cn(buttonClassName, className)}
        >
            <Plus className="size-4" strokeWidth={2.5} />
            {label}
        </Link>
    );
}
