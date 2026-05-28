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
                'shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-bold transition duration-300',
                active
                    ? 'bg-linear-to-r from-[#ff4da6] to-[#c026d3] text-white shadow-[0_8px_20px_-10px_rgba(236,72,153,0.9)]'
                    : 'border-2 border-[#fbcfe8] bg-white text-[#be185d] hover:border-[#f9a8d4] hover:bg-[#fff5f8]',
            )}
        >
            {label}
        </button>
    );
}
