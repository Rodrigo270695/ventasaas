import { cn } from '@/lib/utils';
import type { CatalogProduct } from '@/types/welcome';

const CANDY_PALETTES = [
    { from: '#fff1f2', via: '#ffe4e6', to: '#fecdd3', accent: '#e11d48', dot: '#fb7185' },
    { from: '#fff7ed', via: '#ffedd5', to: '#fed7aa', accent: '#ea580c', dot: '#fb923c' },
    { from: '#fefce8', via: '#fef9c3', to: '#fde68a', accent: '#ca8a04', dot: '#facc15' },
    { from: '#f0fdf4', via: '#dcfce7', to: '#bbf7d0', accent: '#16a34a', dot: '#4ade80' },
    { from: '#eff6ff', via: '#dbeafe', to: '#bfdbfe', accent: '#2563eb', dot: '#60a5fa' },
    { from: '#faf5ff', via: '#f3e8ff', to: '#e9d5ff', accent: '#9333ea', dot: '#c084fc' },
] as const;

function paletteForProduct(product: CatalogProduct) {
    const seed =
        product.category_id ??
        product.category_name ??
        product.name ??
        product.id;
    let hash = 0;

    for (let i = 0; i < seed.length; i += 1) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    return CANDY_PALETTES[Math.abs(hash) % CANDY_PALETTES.length];
}

function initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return '?';
    }

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

type Props = {
    product: CatalogProduct;
    className?: string;
};

export function CatalogProductVisual({ product, className }: Props) {
    const palette = paletteForProduct(product);

    return (
        <div
            className={cn(
                'relative flex aspect-square items-center justify-center overflow-hidden',
                className,
            )}
            style={{
                background: `linear-gradient(145deg, ${palette.from} 0%, ${palette.via} 52%, ${palette.to} 100%)`,
            }}
        >
            <div
                className="absolute inset-0 opacity-50"
                style={{
                    backgroundImage: `radial-gradient(circle, ${palette.dot} 1.5px, transparent 1.5px)`,
                    backgroundSize: '18px 18px',
                }}
            />

            <div
                className="relative flex size-24 items-center justify-center rounded-[1.75rem] border-4 border-white bg-white/90 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.25)] sm:size-28"
                style={{ color: palette.accent }}
            >
                <span className="text-3xl font-black tracking-tight sm:text-4xl">
                    {initials(product.name)}
                </span>
            </div>
        </div>
    );
}
