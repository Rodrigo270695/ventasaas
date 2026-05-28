import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { CatalogProductCard } from '@/components/welcome/catalog-product-card';
import { WelcomeCatalogEmptyState } from '@/components/welcome/welcome-catalog-empty-state';
import { WelcomeCategoryChip } from '@/components/welcome/welcome-category-chip';
import { Input } from '@/components/ui/input';
import { usePagination } from '@/hooks/use-pagination';
import type { CatalogCategory, CatalogProduct } from '@/types/welcome';

const ALL_CATEGORIES = '__all__';

type Props = {
    products: CatalogProduct[];
    categories: CatalogCategory[];
    onAddToCart: (product: CatalogProduct, variantId: string) => void;
};

export function WelcomeCatalogSection({
    products,
    categories,
    onAddToCart,
}: Props) {
    const [query, setQuery] = useState('');
    const [categoryId, setCategoryId] = useState(ALL_CATEGORIES);

    const hasUncategorized = products.some((product) => !product.category_id);

    const filteredProducts = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return products.filter((product) => {
            const matchesCategory =
                categoryId === ALL_CATEGORIES ||
                product.category_id === categoryId ||
                (categoryId === 'uncategorized' && !product.category_id);

            if (!matchesCategory) {
                return false;
            }

            if (!normalizedQuery) {
                return true;
            }

            const haystack = [
                product.name,
                product.description,
                product.category_name,
                product.brand_name,
                ...product.variants.map(
                    (variant) => `${variant.sku} ${variant.label ?? ''}`,
                ),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(normalizedQuery);
        });
    }, [products, categoryId, query]);

    const {
        paginatedItems,
        page,
        setPage,
        pageSize,
        setPageSize,
        totalItems,
        totalPages,
        rangeStart,
        rangeEnd,
    } = usePagination(filteredProducts, { initialPageSize: 15 });

    useEffect(() => {
        setPage(1);
    }, [query, categoryId, setPage]);

    const handlePageChange = (nextPage: number) => {
        setPage(nextPage);
        document.getElementById('catalogo')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    return (
        <section id="catalogo" className="scroll-mt-[3.75rem]">
            <div className="sticky top-14 z-20 overflow-hidden rounded-[1.75rem] border-[3px] border-[#fbcfe8] bg-white/95 shadow-[0_20px_50px_-28px_rgba(236,72,153,0.35)] backdrop-blur-xl">
                <div className="h-1.5 bg-linear-to-r from-[#fde047] via-[#fb7185] to-[#c084fc]" />

                <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[10px] font-black tracking-[0.18em] text-[#db2777] uppercase">
                                Dulcería
                            </p>
                            <h2 className="text-2xl font-black tracking-tight text-[#831843] sm:text-3xl">
                                Nuestros productos
                            </h2>
                            <p className="mt-1 text-sm font-medium text-[#be185d]/80">
                                {totalItems} disponibles
                                {query ? ' con tu búsqueda' : ''}
                            </p>
                        </div>

                        <div className="relative w-full max-w-md">
                            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#f472b6]" />
                            <Input
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder="Buscar producto, marca o SKU…"
                                className="h-11 rounded-full border-[#fbcfe8] bg-[#fff5f8] pl-11 focus-visible:ring-[#ec4899]/30"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <WelcomeCategoryChip
                            active={categoryId === ALL_CATEGORIES}
                            onClick={() => setCategoryId(ALL_CATEGORIES)}
                            label="Todos"
                        />
                        {categories.map((category) => (
                            <WelcomeCategoryChip
                                key={category.id}
                                active={categoryId === category.id}
                                onClick={() => setCategoryId(category.id)}
                                label={category.name}
                            />
                        ))}
                        {hasUncategorized ? (
                            <WelcomeCategoryChip
                                active={categoryId === 'uncategorized'}
                                onClick={() => setCategoryId('uncategorized')}
                                label="Sin categoría"
                            />
                        ) : null}
                    </div>
                </div>
            </div>

            {filteredProducts.length === 0 ? (
                <WelcomeCatalogEmptyState hasProducts={products.length > 0} />
            ) : (
                <>
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {paginatedItems.map((product) => (
                            <CatalogProductCard
                                key={product.id}
                                product={product}
                                onAdd={(variantId) =>
                                    onAddToCart(product, variantId)
                                }
                            />
                        ))}
                    </div>

                    <div className="mt-6 overflow-hidden rounded-2xl border border-[#fbcfe8] bg-white/90 shadow-sm">
                        <DataTablePagination
                            page={page}
                            pageSize={pageSize}
                            totalItems={totalItems}
                            totalPages={totalPages}
                            rangeStart={rangeStart}
                            rangeEnd={rangeEnd}
                            onPageChange={handlePageChange}
                            onPageSizeChange={setPageSize}
                            className="rounded-2xl border-0 bg-[#fff5f8]/80"
                        />
                    </div>
                </>
            )}
        </section>
    );
}
