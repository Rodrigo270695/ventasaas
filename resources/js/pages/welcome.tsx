import { Head, usePage } from '@inertiajs/react';
import { useCallback } from 'react';
import { CatalogCartPanel } from '@/components/welcome/catalog-cart-panel';
import { WelcomeBackgroundDecor } from '@/components/welcome/welcome-background-decor';
import { WelcomeCatalogSection } from '@/components/welcome/welcome-catalog-section';
import { WelcomeFeaturesSection } from '@/components/welcome/welcome-features-section';
import { WelcomeFooter } from '@/components/welcome/welcome-footer';
import { WelcomeHeroCarousel } from '@/components/welcome/welcome-hero-carousel';
import { WelcomeMobileCartFab } from '@/components/welcome/welcome-mobile-cart-fab';
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
}: WelcomePageProps) {
    const { company } = usePage().props;
    const branding = company as CompanyBranding;
    const displayName = store.name ?? branding.name;

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
            <Head title={displayName} />

            <div className="relative min-h-screen overflow-x-hidden bg-[#fff5f8] text-[#831843]">
                <WelcomeBackgroundDecor />

                <WelcomeNavbar
                    cartItemCount={cart.itemCount}
                    whatsappUrl={whatsappContactUrl}
                    onOpenCart={() => cart.setCartOpen(true)}
                    onScrollToCatalog={scrollToCatalog}
                />

                <WelcomeHeroCarousel
                    slides={heroSlides}
                    storeName={displayName}
                    tagline={branding.tagline}
                    whatsappConfigured={Boolean(store.whatsapp_number)}
                    onExploreCatalog={scrollToCatalog}
                    onOpenCart={() => cart.setCartOpen(true)}
                />

                <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
                    <WelcomeCatalogSection
                        products={products}
                        categories={categories}
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

                <WelcomeMobileCartFab
                    itemCount={cart.itemCount}
                    onOpenCart={() => cart.setCartOpen(true)}
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
