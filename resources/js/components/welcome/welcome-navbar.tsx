import {
    LayoutGrid,
    Menu,
    MessageCircle,
    ShoppingCart,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { WelcomeNavbarBrand } from '@/components/welcome/welcome-navbar-brand';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type Props = {
    cartItemCount: number;
    whatsappUrl?: string | null;
    onOpenCart: () => void;
    onScrollToCatalog: () => void;
};

export function WelcomeNavbar({
    cartItemCount,
    whatsappUrl,
    onOpenCart,
    onScrollToCatalog,
}: Props) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 32);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const closeMobile = useCallback(() => setMobileOpen(false), []);

    const handleCatalogClick = useCallback(() => {
        closeMobile();
        onScrollToCatalog();
    }, [closeMobile, onScrollToCatalog]);

    const navLinkClass = cn(
        'cursor-pointer rounded-full px-3 py-1.5 text-sm font-bold transition',
        'text-white/92 hover:bg-white/12 hover:text-white',
    );

    return (
        <>
            <header
                className={cn(
                    'fixed top-0 right-0 left-0 z-50 transition-all duration-300',
                    scrolled
                        ? 'border-b border-[#ff9ecf]/20 bg-[#3b0764]/92 shadow-[0_10px_30px_-18px_rgba(59,7,100,0.85)] backdrop-blur-xl'
                        : 'border-b border-white/10 bg-linear-to-b from-[#12061f]/55 to-transparent backdrop-blur-sm',
                )}
            >
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
                    <WelcomeNavbarBrand />

                    <nav className="hidden items-center gap-1 md:flex">
                        <button
                            type="button"
                            onClick={onScrollToCatalog}
                            className={navLinkClass}
                        >
                            Catálogo
                        </button>
                        {whatsappUrl ? (
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={navLinkClass}
                            >
                                WhatsApp
                            </a>
                        ) : null}
                    </nav>

                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            onClick={onOpenCart}
                            className="relative h-9 cursor-pointer rounded-full bg-linear-to-r from-[#ff4da6] to-[#a855f7] px-3.5 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(236,72,153,0.85)] transition hover:scale-[1.02]"
                        >
                            <ShoppingCart className="mr-1.5 size-4" />
                            Carrito
                            {cartItemCount > 0 ? (
                                <span className="absolute -top-1.5 -right-1.5 flex size-[18px] items-center justify-center rounded-full bg-[#fde047] text-[10px] font-black text-[#7c2d12] shadow">
                                    {cartItemCount}
                                </span>
                            ) : null}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileOpen(true)}
                            className="size-9 cursor-pointer rounded-full text-white hover:bg-white/10 md:hidden"
                            aria-label="Abrir menú"
                        >
                            <Menu className="size-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent
                    side="right"
                    className="w-[min(100vw-2rem,20rem)] border-[#fbcfe8] bg-[#fff5f8]"
                >
                    <SheetHeader className="border-b border-[#fbcfe8] pb-3 text-left">
                        <SheetTitle className="text-[#831843]">Menú</SheetTitle>
                    </SheetHeader>

                    <nav className="mt-5 space-y-2">
                        <button
                            type="button"
                            onClick={handleCatalogClick}
                            className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-[#831843] transition hover:bg-[#fce7f3]"
                        >
                            <LayoutGrid className="size-4 text-[#ec4899]" />
                            Ver catálogo
                        </button>

                        {whatsappUrl ? (
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={closeMobile}
                                className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-[#831843] transition hover:bg-[#fce7f3]"
                            >
                                <MessageCircle className="size-4 text-[#25D366]" />
                                WhatsApp
                            </a>
                        ) : null}

                        <button
                            type="button"
                            onClick={() => {
                                closeMobile();
                                onOpenCart();
                            }}
                            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#ff4da6] to-[#a855f7] px-4 py-3 text-sm font-bold text-white"
                        >
                            <ShoppingCart className="size-4" />
                            Carrito{cartItemCount > 0 ? ` (${cartItemCount})` : ''}
                        </button>
                    </nav>
                </SheetContent>
            </Sheet>
        </>
    );
}
