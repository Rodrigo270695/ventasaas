import { usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { SeoHead } from '@/components/seo/seo-head';
import { CatalogCartPanel } from '@/components/welcome/catalog-cart-panel';
import { WelcomeAnnouncementBar } from '@/components/welcome/welcome-announcement-bar';
import { WelcomeBackgroundDecor } from '@/components/welcome/welcome-background-decor';
import {
    ALL_CATEGORIES,
    WelcomeCatalogSection,
} from '@/components/welcome/welcome-catalog-section';
import { WelcomeCategoryNav } from '@/components/welcome/welcome-category-nav';
import { WelcomeFeaturesSection } from '@/components/welcome/welcome-features-section';
import { WelcomeFooter } from '@/components/welcome/welcome-footer';
import { WelcomeHeroCarousel } from '@/components/welcome/welcome-hero-carousel';
import { WelcomeMobileBottomNav } from '@/components/welcome/welcome-mobile-bottom-nav';
import { WelcomeNavbar } from '@/components/welcome/welcome-navbar';
import { useCatalogCart } from '@/hooks/use-catalog-cart';
import { buildWhatsappCheckoutUrl } from '@/lib/whatsapp-order';
import type { CompanyBranding } from '@/types/company';
import type { WelcomePageProps } from '@/types/welcome';

export default function Welcome({
    store,
    heroSlides,
    categories,
    products,
    seo,
}: WelcomePageProps) {
    const { company } = usePage().props;
    const branding = company as CompanyBranding;
    const displayName = store.name ?? branding.name;

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryId, setCategoryId] = useState(ALL_CATEGORIES);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const cart = useCatalogCart(
        store.whatsapp_number,
        store.name ?? branding.name,
    );

    const currencyCode = products[0]?.variants[0]?.currency_code ?? 'PEN';

    const whatsappContactUrl = store.whatsapp_number
        ? buildWhatsappCheckoutUrl(
              store.whatsapp_number,
              `Hola, me gustaría consultar sobre los productos de *${displayName}*.`,
          )
        : null;

    const scrollToCatalog = useCallback(() => {
        document.getElementById('catalogo')?.scrollIntoView({
            behavior: 'smooth',
        });
    }, []);

    return (
        <>
            <SeoHead seo={seo} />

            <div className="relative min-h-screen bg-[#fffbf5] text-[#1f2937]">
                <WelcomeBackgroundDecor />

                <WelcomeAnnouncementBar storeName={displayName} />

                <div className="md:sticky md:top-0 md:z-50 md:bg-white md:shadow-sm">
                    <WelcomeNavbar
                        cartItemCount={cart.itemCount}
                        whatsappUrl={whatsappContactUrl}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onOpenCart={() => cart.setCartOpen(true)}
                        onScrollToCatalog={scrollToCatalog}
                        mobileMenuOpen={mobileMenuOpen}
                        onMobileMenuOpenChange={setMobileMenuOpen}
                    />

                    <WelcomeCategoryNav
                        categories={categories}
                        activeCategoryId={categoryId}
                        onSelectCategory={setCategoryId}
                        onScrollToCatalog={scrollToCatalog}
                    />
                </div>

                <WelcomeHeroCarousel
                    slides={heroSlides}
                    storeName={displayName}
                    tagline={branding.tagline}
                    whatsappConfigured={Boolean(store.whatsapp_number)}
                    onExploreCatalog={scrollToCatalog}
                    onOpenCart={() => cart.setCartOpen(true)}
                />

                <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
                    <WelcomeCatalogSection
                        products={products}
                        categories={categories}
                        query={searchQuery}
                        categoryId={categoryId}
                        onCategoryChange={setCategoryId}
                        onAddToCart={cart.addProduct}
                    />

                    <WelcomeFeaturesSection />
                </main>

                <WelcomeFooter
                    storeName={displayName}
                    tagline={branding.tagline}
                    whatsappNumber={store.whatsapp_number}
                    checkoutUrl={cart.checkoutUrl}
                    onScrollToCatalog={scrollToCatalog}
                />

                <WelcomeMobileBottomNav
                    cartItemCount={cart.itemCount}
                    whatsappUrl={whatsappContactUrl}
                    onOpenCart={() => cart.setCartOpen(true)}
                    onScrollToCatalog={scrollToCatalog}
                    onOpenMenu={() => setMobileMenuOpen(true)}
                />

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
