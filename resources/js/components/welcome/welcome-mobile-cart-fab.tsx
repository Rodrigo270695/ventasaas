import { ShoppingCart } from 'lucide-react';

type Props = {
    itemCount: number;
    onOpenCart: () => void;
};

export function WelcomeMobileCartFab({ itemCount, onOpenCart }: Props) {
    if (itemCount <= 0) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={onOpenCart}
            className="fixed right-4 bottom-4 z-40 flex cursor-pointer items-center gap-2 rounded-full bg-linear-to-r from-[#ff4da6] to-[#c026d3] px-5 py-3.5 font-black text-white shadow-[0_18px_40px_-12px_rgba(236,72,153,0.85)] transition hover:scale-[1.03] md:hidden"
        >
            <ShoppingCart className="size-4" />
            Carrito ({itemCount})
        </button>
    );
}
