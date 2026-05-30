import { useEffect, useMemo } from 'react';
import { CatalogProductCard } from '@/components/welcome/catalog-product-card';
import { WelcomeCatalogEmptyState } from '@/components/welcome/welcome-catalog-empty-state';
import {
    WELCOME_CATALOG_PAGE_SIZE,
    WelcomeCatalogPagination,
} from '@/components/welcome/welcome-catalog-pagination';
import { WelcomeCategoryChip } from '@/components/welcome/welcome-category-chip';
import { usePagination } from '@/hooks/use-pagination';
import type { CatalogCategory, CatalogProduct } from '@/types/welcome';

export const ALL_CATEGORIES = '__all__';

type Props = {
    products: CatalogProduct[];
    categories: CatalogCategory[];
    query: string;
    categoryId: string;
    onCategoryChange: (categoryId: string) => void;
    onAddToCart: (product: CatalogProduct, variantId: string) => void;
};

export function WelcomeCatalogSection({
    products,
    categories,
    query,
    categoryId,
    onCategoryChange,
    onAddToCart,
}: Props) {
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
        totalItems,
        totalPages,
        rangeStart,
        rangeEnd,
    } = usePagination(filteredProducts, {
        initialPageSize: WELCOME_CATALOG_PAGE_SIZE,
    });

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
        <section id="catalogo" className="scroll-mt-4 md:scroll-mt-44">
            <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-xl font-black tracking-tight text-[#9a3412] sm:text-2xl">
                        Nuestros productos
                    </h2>
                    <p className="mt-1 text-sm text-[#6b7280]">
                        {totalItems} disponibles
                        {query ? ' con tu búsqueda' : ''}
                    </p>
                </div>
            </div>

            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <WelcomeCategoryChip
                    active={categoryId === ALL_CATEGORIES}
                    onClick={() => onCategoryChange(ALL_CATEGORIES)}
                    label="Todos"
                />
                {categories.map((category) => (
                    <WelcomeCategoryChip
                        key={category.id}
                        active={categoryId === category.id}
                        onClick={() => onCategoryChange(category.id)}
                        label={category.name}
                    />
                ))}
                {hasUncategorized ? (
                    <WelcomeCategoryChip
                        active={categoryId === 'uncategorized'}
                        onClick={() => onCategoryChange('uncategorized')}
                        label="Sin categoría"
                    />
                ) : null}
            </div>

            {filteredProducts.length === 0 ? (
                <WelcomeCatalogEmptyState hasProducts={products.length > 0} />
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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

                    <WelcomeCatalogPagination
                        page={page}
                        totalItems={totalItems}
                        totalPages={totalPages}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </section>
    );
}
