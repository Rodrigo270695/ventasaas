import { router } from '@inertiajs/react';
import { show } from '@/routes/admin/catalogo/productos';
import { cn } from '@/lib/utils';
import type { ProductShowTab } from '@/types/admin/products';

const TABS: { id: ProductShowTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'variantes', label: 'Variantes' },
    { id: 'precios', label: 'Precios' },
    { id: 'impuestos', label: 'Impuestos' },
    { id: 'stock', label: 'Stock' },
    { id: 'empaque', label: 'Empaque' },
];

type Props = {
    productId: string;
    activeTab: ProductShowTab;
};

export function ProductShowTabs({ productId, activeTab }: Props) {
    const selectTab = (tab: ProductShowTab) => {
        if (tab === activeTab) {
            return;
        }

        router.get(
            show.url(productId, { query: { tab: tab } }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <nav
            className="flex flex-wrap gap-1 rounded-xl border border-violet-100/90 bg-violet-50/40 p-1"
            aria-label="Secciones del producto"
        >
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => selectTab(tab.id)}
                    className={cn(
                        'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                        activeTab === tab.id
                            ? 'bg-white text-[#6d28d9] shadow-sm ring-1 ring-violet-200/80'
                            : 'text-[#7c6f8a] hover:bg-white/60 hover:text-[#5b4d6e]',
                    )}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}
