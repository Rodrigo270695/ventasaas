import { Head, Link, usePage } from '@inertiajs/react';
import { MessageCircle, Search, ShoppingCart } from 'lucide-react';
import { useMemo, useState } from 'react';
import CompanyBrand from '@/components/company-brand';
import { CatalogCartPanel } from '@/components/welcome/catalog-cart-panel';
import { CatalogProductCard } from '@/components/welcome/catalog-product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCatalogCart } from '@/hooks/use-catalog-cart';
import { dashboard, login } from '@/routes';
import { cn } from '@/lib/utils';
import type { CompanyBranding } from '@/types/company';
import type { WelcomePageProps } from '@/types/welcome';

const ALL_CATEGORIES = '__all__';

export default function Welcome({
    store,
    categories,
    products,
}: WelcomePageProps) {
    const { auth, company } = usePage().props;
    const branding = company as CompanyBranding;

    const [query, setQuery] = useState('');
    const [categoryId, setCategoryId] = useState(ALL_CATEGORIES);

    const cart = useCatalogCart(store.whatsapp_number, store.name ?? branding.name);

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

    const hasUncategorized = products.some((product) => !product.category_id);
    const currencyCode = products[0]?.variants[0]?.currency_code ?? 'PEN';

    return (
        <>
            <Head title={branding.name} />

            <div className="min-h-screen bg-[#faf7ff] text-[#2e1065]">
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-[#ec4899]/20 blur-3xl" />
                    <div className="absolute top-32 -left-20 h-64 w-64 rounded-full bg-[#7c3aed]/20 blur-3xl" />
                    <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-[#f472b6]/15 blur-3xl" />
                </div>

                <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                        <Link href="/" className="shrink-0">
                            <CompanyBrand />
                        </Link>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="hidden rounded-xl border border-violet-200 px-4 py-2 text-sm font-medium text-[#6d28d9] hover:bg-violet-50 sm:inline-flex"
                                >
                                    Panel
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    className="hidden rounded-xl border border-violet-200 px-4 py-2 text-sm font-medium text-[#6d28d9] hover:bg-violet-50 sm:inline-flex"
                                >
                                    Acceso personal
                                </Link>
                            )}

                            <Button
                                type="button"
                                onClick={() => cart.setCartOpen(true)}
                                className="relative cursor-pointer rounded-xl bg-linear-to-r from-[#ec4899] to-[#7c3aed] px-4 font-semibold text-white shadow-lg shadow-violet-400/30 hover:opacity-95"
                            >
                                <ShoppingCart className="mr-2 size-4" />
                                Carrito
                                {cart.itemCount > 0 ? (
                                    <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#7c3aed] shadow">
                                        {cart.itemCount}
                                    </span>
                                ) : null}
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
                    <section className="mb-10 overflow-hidden rounded-[2rem] border border-white/70 bg-linear-to-br from-[#2e1065] via-[#5b21b6] to-[#7c3aed] px-6 py-10 text-white shadow-2xl shadow-violet-900/20 sm:px-10 sm:py-14">
                        <div className="max-w-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-200">
                                Catálogo premium
                            </p>
                            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
                                {store.name ?? branding.name}
                            </h1>
                            <p className="mt-4 max-w-xl text-base leading-relaxed text-violet-100/90 sm:text-lg">
                                {branding.tagline ??
                                    'Explora nuestros productos, arma tu pedido y confírmalo por WhatsApp en segundos.'}
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    onClick={() => cart.setCartOpen(true)}
                                    className="cursor-pointer rounded-xl bg-white px-5 font-semibold text-[#5b21b6] hover:bg-violet-50"
                                >
                                    Ver carrito
                                </Button>
                                {store.whatsapp_number ? (
                                    <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-violet-50">
                                        <MessageCircle className="size-4" />
                                        Pedidos por WhatsApp
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </section>

                    <section className="mb-6 space-y-4">
                        <div className="relative max-w-xl">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9d8fb0]" />
                            <Input
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder="Buscar producto, marca o SKU…"
                                className="h-11 rounded-xl border-violet-200 bg-white/90 pl-10 shadow-sm"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <CategoryChip
                                active={categoryId === ALL_CATEGORIES}
                                onClick={() => setCategoryId(ALL_CATEGORIES)}
                                label="Todos"
                            />
                            {categories.map((category) => (
                                <CategoryChip
                                    key={category.id}
                                    active={categoryId === category.id}
                                    onClick={() => setCategoryId(category.id)}
                                    label={category.name}
                                />
                            ))}
                            {hasUncategorized ? (
                                <CategoryChip
                                    active={categoryId === 'uncategorized'}
                                    onClick={() =>
                                        setCategoryId('uncategorized')
                                    }
                                    label="Sin categoría"
                                />
                            ) : null}
                        </div>
                    </section>

                    {filteredProducts.length === 0 ? (
                        <div className="rounded-[1.75rem] border border-dashed border-violet-200 bg-white/70 px-6 py-16 text-center shadow-sm">
                            <p className="text-lg font-semibold text-[#4c1d95]">
                                No hay productos para mostrar
                            </p>
                            <p className="mt-2 text-sm text-[#7c6f8a]">
                                {products.length === 0
                                    ? 'Activa productos con precio en el panel de administración.'
                                    : 'Prueba otra categoría o limpia la búsqueda.'}
                            </p>
                        </div>
                    ) : (
                        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredProducts.map((product) => (
                                <CatalogProductCard
                                    key={product.id}
                                    product={product}
                                    onAdd={(variantId) =>
                                        cart.addProduct(product, variantId)
                                    }
                                />
                            ))}
                        </section>
                    )}
                </main>

                <CatalogCartPanel
                    open={cart.cartOpen}
                    onOpenChange={cart.setCartOpen}
                    lines={cart.lines}
                    itemCount={cart.itemCount}
                    total={cart.total}
                    currencyCode={currencyCode}
                    canCheckout={cart.canCheckout}
                    checkoutUrl={cart.checkoutUrl}
                    whatsappConfigured={Boolean(store.whatsapp_number)}
                    onUpdateQuantity={cart.updateQuantity}
                    onRemoveLine={cart.removeLine}
                    onClear={cart.clearCart}
                />
            </div>
        </>
    );
}

function CategoryChip({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition',
                active
                    ? 'bg-linear-to-r from-[#ec4899] to-[#7c3aed] text-white shadow-md shadow-violet-300/40'
                    : 'border border-violet-200 bg-white/80 text-[#6d28d9] hover:bg-violet-50',
            )}
        >
            {label}
        </button>
    );
}
