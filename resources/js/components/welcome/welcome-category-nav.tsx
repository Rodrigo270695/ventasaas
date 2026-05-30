import { cn } from '@/lib/utils';
import type { CatalogCategory } from '@/types/welcome';

const CATEGORY_PALETTES = [
    { bg: '#fff3e0', accent: '#ea580c' },
    { bg: '#fef9c3', accent: '#ca8a04' },
    { bg: '#fce7f3', accent: '#db2777' },
    { bg: '#dcfce7', accent: '#16a34a' },
    { bg: '#e0f2fe', accent: '#0284c7' },
    { bg: '#f3e8ff', accent: '#9333ea' },
    { bg: '#ffedd5', accent: '#c2410c' },
    { bg: '#ccfbf1', accent: '#0d9488' },
] as const;

function paletteForCategory(id: string) {
    let hash = 0;

    for (let i = 0; i < id.length; i += 1) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    return CATEGORY_PALETTES[Math.abs(hash) % CATEGORY_PALETTES.length];
}

function categoryInitial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
}

type Props = {
    categories: CatalogCategory[];
    activeCategoryId: string;
    onSelectCategory: (categoryId: string) => void;
    onScrollToCatalog: () => void;
};

export function WelcomeCategoryNav({
    categories,
    activeCategoryId,
    onSelectCategory,
    onScrollToCatalog,
}: Props) {
    if (categories.length === 0) {
        return null;
    }

    const handleSelect = (categoryId: string) => {
        onSelectCategory(categoryId);
        onScrollToCatalog();
    };

    return (
        <section
            aria-label="Categorías"
            className="border-b border-[#fed7aa]/50 bg-linear-to-b from-[#fff7ed]/80 to-white"
        >
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none sm:gap-4">
                    <button
                        type="button"
                        onClick={() => handleSelect('__all__')}
                        className="group flex shrink-0 flex-col items-center gap-1.5"
                    >
                        <span
                            className={cn(
                                'flex size-14 items-center justify-center rounded-2xl text-lg font-black transition sm:size-16',
                                activeCategoryId === '__all__'
                                    ? 'bg-[#f97316] text-white shadow-md shadow-orange-200'
                                    : 'bg-[#f3f4f6] text-[#374151] group-hover:bg-[#fef3c7]',
                            )}
                        >
                            ★
                        </span>
                        <span className="max-w-[4.5rem] truncate text-[11px] font-semibold text-[#374151] sm:text-xs">
                            Todos
                        </span>
                    </button>

                    {categories.map((category) => {
                        const palette = paletteForCategory(category.id);
                        const active = activeCategoryId === category.id;

                        return (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => handleSelect(category.id)}
                                className="group flex shrink-0 flex-col items-center gap-1.5"
                            >
                                <span
                                    className={cn(
                                        'flex size-14 items-center justify-center rounded-2xl text-lg font-black transition sm:size-16',
                                        active && 'ring-2 ring-[#f97316] ring-offset-2',
                                    )}
                                    style={{
                                        backgroundColor: palette.bg,
                                        color: palette.accent,
                                    }}
                                >
                                    {categoryInitial(category.name)}
                                </span>
                                <span className="max-w-[4.5rem] truncate text-[11px] font-semibold text-[#374151] sm:text-xs">
                                    {category.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
