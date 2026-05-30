import { cn } from '@/lib/utils';

type Props = {
    label: string;
    active: boolean;
    onClick: () => void;
};

export function WelcomeCategoryChip({ label, active, onClick }: Props) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition duration-200',
                active
                    ? 'bg-[#f97316] text-white shadow-sm'
                    : 'border border-[#e5e7eb] bg-white text-[#374151] hover:border-[#f97316]/40 hover:bg-[#fff7ed]',
            )}
        >
            {label}
        </button>
    );
}
