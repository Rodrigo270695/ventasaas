import { Grid3X3, Menu, MessageCircle, ShoppingCart } from 'lucide-react';

type Props = {
    cartItemCount: number;
    whatsappUrl?: string | null;
    onOpenCart: () => void;
    onScrollToCatalog: () => void;
    onOpenMenu: () => void;
};

export function WelcomeMobileBottomNav({
    cartItemCount,
    whatsappUrl,
    onOpenCart,
    onScrollToCatalog,
    onOpenMenu,
}: Props) {
    const items = [
        {
            key: 'catalog',
            label: 'Catálogo',
            icon: Grid3X3,
            onClick: onScrollToCatalog,
        },
        {
            key: 'cart',
            label: 'Carrito',
            icon: ShoppingCart,
            onClick: onOpenCart,
            badge: cartItemCount,
        },
        {
            key: 'menu',
            label: 'Menú',
            icon: Menu,
            onClick: onOpenMenu,
        },
    ] as const;

    return (
        <>
            {whatsappUrl ? (
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed right-4 bottom-[4.25rem] z-40 flex size-12 cursor-pointer items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-400/40 transition hover:scale-105 md:hidden"
                    aria-label="Contactar por WhatsApp"
                >
                    <MessageCircle className="size-5" />
                </a>
            ) : null}

            <nav
                aria-label="Navegación móvil"
                className="fixed right-0 bottom-0 left-0 z-40 bg-[#3d5c45] shadow-[0_-4px_20px_rgba(61,92,69,0.35)] md:hidden"
            >
                <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
                    {items.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={item.onClick}
                            className="relative flex flex-1 cursor-pointer flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold text-white transition active:text-[#fde68a]"
                        >
                            <span className="relative">
                                <item.icon className="size-5" strokeWidth={2} />
                                {'badge' in item && item.badge > 0 ? (
                                    <span className="absolute -top-1.5 -right-2.5 flex size-4 items-center justify-center rounded-full bg-[#f97316] text-[9px] font-black text-white ring-2 ring-[#3d5c45]">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </>
    );
}
