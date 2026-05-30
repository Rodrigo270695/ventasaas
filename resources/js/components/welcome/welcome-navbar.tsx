import {
    LayoutGrid,
    MessageCircle,
    Search,
    ShoppingCart,
} from 'lucide-react';
import { useCallback } from 'react';
import { WelcomeNavbarBrand } from '@/components/welcome/welcome-navbar-brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onOpenCart: () => void;
    onScrollToCatalog: () => void;
    mobileMenuOpen: boolean;
    onMobileMenuOpenChange: (open: boolean) => void;
};

export function WelcomeNavbar({
    cartItemCount,
    whatsappUrl,
    searchQuery,
    onSearchChange,
    onOpenCart,
    onScrollToCatalog,
    mobileMenuOpen,
    onMobileMenuOpenChange,
}: Props) {
    const closeMobile = useCallback(
        () => onMobileMenuOpenChange(false),
        [onMobileMenuOpenChange],
    );

    const handleCatalogClick = useCallback(() => {
        closeMobile();
        onScrollToCatalog();
    }, [closeMobile, onScrollToCatalog]);

    const handleSearchFocus = useCallback(() => {
        onScrollToCatalog();
    }, [onScrollToCatalog]);

    return (
        <>
            <header
                className={cn(
                    'relative z-30 border-b border-[#fed7aa]/60 bg-linear-to-r from-[#fff7ed] via-white to-[#e0f2fe]',
                    'md:border-[#e5e7eb] md:bg-white',
                )}
            >
                <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
                    <WelcomeNavbarBrand />

                    <div className="relative hidden min-w-0 flex-1 md:block">
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#f97316]" />
                        <Input
                            value={searchQuery}
                            onChange={(event) =>
                                onSearchChange(event.target.value)
                            }
                            onFocus={handleSearchFocus}
                            placeholder="Buscar productos…"
                            className="h-10 rounded-full border-[#fed7aa] bg-[#fff7ed]/50 pl-11 focus-visible:ring-[#f97316]/40"
                        />
                    </div>

                    <div className="ml-auto hidden items-center gap-1 md:flex sm:gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleCatalogClick}
                            className="size-9 cursor-pointer rounded-full text-[#ea580c] hover:bg-[#fff7ed]"
                            aria-label="Ver catálogo"
                        >
                            <LayoutGrid className="size-5" />
                        </Button>

                        {whatsappUrl ? (
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-[#25D366] transition hover:bg-emerald-50"
                                aria-label="WhatsApp"
                            >
                                <MessageCircle className="size-5" />
                            </a>
                        ) : null}

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onOpenCart}
                            className="relative size-9 cursor-pointer rounded-full text-[#ea580c] hover:bg-[#fff7ed]"
                            aria-label="Abrir carrito"
                        >
                            <ShoppingCart className="size-5" />
                            {cartItemCount > 0 ? (
                                <span className="absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full bg-[#f97316] text-[10px] font-black text-white">
                                    {cartItemCount}
                                </span>
                            ) : null}
                        </Button>
                    </div>
                </div>

                <div className="border-t border-[#fed7aa]/40 px-4 pb-3 md:hidden">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#f97316]" />
                        <Input
                            value={searchQuery}
                            onChange={(event) =>
                                onSearchChange(event.target.value)
                            }
                            onFocus={handleSearchFocus}
                            placeholder="Buscar productos…"
                            className="h-10 rounded-full border-[#fed7aa] bg-white pl-10 focus-visible:ring-[#f97316]/40"
                        />
                    </div>
                </div>
            </header>

            <Sheet open={mobileMenuOpen} onOpenChange={onMobileMenuOpenChange}>
                {mobileMenuOpen ? (
                    <SheetContent
                        side="right"
                        aria-describedby={undefined}
                        className="w-[min(100vw-2rem,20rem)] border-[#fed7aa] bg-linear-to-b from-[#fff7ed] to-white"
                    >
                        <SheetHeader className="border-b border-[#fed7aa]/60 pb-3 text-left">
                            <SheetTitle className="text-[#9a3412]">
                                Menú
                            </SheetTitle>
                        </SheetHeader>

                    <nav className="mt-5 space-y-1">
                        <button
                            type="button"
                            onClick={handleCatalogClick}
                            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#374151] transition hover:bg-white"
                        >
                            <LayoutGrid className="size-4 text-[#f97316]" />
                            Ver catálogo
                        </button>

                        {whatsappUrl ? (
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={closeMobile}
                                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#374151] transition hover:bg-white"
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
                            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#f97316] px-4 py-3 text-sm font-bold text-white shadow-md shadow-orange-200"
                        >
                            <ShoppingCart className="size-4" />
                            Carrito{cartItemCount > 0 ? ` (${cartItemCount})` : ''}
                        </button>
                    </nav>
                    </SheetContent>
                ) : null}
            </Sheet>
        </>
    );
}
