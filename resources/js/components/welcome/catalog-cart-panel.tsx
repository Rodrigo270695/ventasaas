import {
    MessageCircle,
    Minus,
    Plus,
    ShoppingCart,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatCatalogPrice } from '@/lib/whatsapp-order';
import { cn } from '@/lib/utils';
import type { CartLine } from '@/types/welcome';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lines: CartLine[];
    itemCount: number;
    total: number;
    currencyCode: string;
    canCheckout: boolean;
    checkoutUrl: string | null;
    whatsappConfigured: boolean;
    onUpdateQuantity: (key: string, quantity: number) => void;
    onRemoveLine: (key: string) => void;
    onClear: () => void;
};

export function CatalogCartPanel({
    open,
    onOpenChange,
    lines,
    itemCount,
    total,
    currencyCode,
    canCheckout,
    checkoutUrl,
    whatsappConfigured,
    onUpdateQuantity,
    onRemoveLine,
    onClear,
}: Props) {
    useEffect(() => {
        if (!open) {
            (document.activeElement as HTMLElement | null)?.blur();
        }
    }, [open]);

    const handleClose = () => {
        (document.activeElement as HTMLElement | null)?.blur();
        onOpenChange(false);
    };

    return (
        <>
            {open ? (
                <div
                    className="fixed inset-0 z-40 bg-[#1f2937]/40 backdrop-blur-sm transition-opacity duration-300"
                    onClick={handleClose}
                    aria-hidden="true"
                />
            ) : null}

            <aside
                className={cn(
                    'fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col',
                    'bg-white shadow-[-24px_0_80px_-20px_rgba(0,0,0,0.15)]',
                    'transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    open ? 'translate-x-0' : 'translate-x-full',
                )}
                inert={!open}
                role="dialog"
                aria-modal={open}
                aria-label="Carrito de compras"
            >
                <div className="relative overflow-hidden border-b border-[#e5e7eb] px-5 py-5">
                    <div className="absolute inset-0 bg-linear-to-br from-[#fff7ed] to-[#ffedd5]" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#f97316] shadow-sm">
                                <ShoppingCart className="size-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ca3af]">
                                    Tu selección
                                </p>
                                <h2 className="text-xl font-bold text-[#1f2937]">
                                    Carrito
                                </h2>
                                <p className="text-xs text-[#6b7280]">
                                    {itemCount}{' '}
                                    {itemCount === 1
                                        ? 'producto'
                                        : 'productos'}{' '}
                                    listos para enviar
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 cursor-pointer rounded-2xl text-[#374151] hover:bg-white/60"
                            onClick={handleClose}
                            aria-label="Cerrar carrito"
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5">
                    {lines.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] px-6 py-14 text-center">
                            <div className="flex size-16 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#f97316]">
                                <Sparkles className="size-7" />
                            </div>
                            <p className="mt-4 text-lg font-bold text-[#1f2937]">
                                Arma tu pedido
                            </p>
                            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#6b7280]">
                                Explora el catálogo, agrega tus productos
                                favoritos y confírmalo por WhatsApp.
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {lines.map((line) => (
                                <li
                                    key={line.key}
                                    className="rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-bold text-[#1f2937]">
                                                {line.productName}
                                            </p>
                                            {line.variantLabel ? (
                                                <p className="mt-0.5 text-xs font-medium text-[#6b7280]">
                                                    {line.variantLabel}
                                                </p>
                                            ) : null}
                                            <p className="mt-1 font-mono text-[11px] text-[#9ca3af]">
                                                {line.sku}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 shrink-0 cursor-pointer rounded-xl text-red-500 hover:bg-red-50"
                                            onClick={() =>
                                                onRemoveLine(line.key)
                                            }
                                            aria-label="Quitar del carrito"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-1 rounded-2xl border border-[#e5e7eb] bg-white p-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-9 cursor-pointer rounded-xl hover:bg-white"
                                                onClick={() =>
                                                    onUpdateQuantity(
                                                        line.key,
                                                        line.quantity - 1,
                                                    )
                                                }
                                                aria-label="Disminuir cantidad"
                                            >
                                                <Minus className="size-3.5" />
                                            </Button>
                                            <span className="min-w-8 text-center text-sm font-bold tabular-nums text-[#1f2937]">
                                                {line.quantity}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-9 cursor-pointer rounded-xl hover:bg-white"
                                                onClick={() =>
                                                    onUpdateQuantity(
                                                        line.key,
                                                        line.quantity + 1,
                                                    )
                                                }
                                                aria-label="Aumentar cantidad"
                                            >
                                                <Plus className="size-3.5" />
                                            </Button>
                                        </div>
                                        <p className="text-base font-black tabular-nums text-[#1f2937]">
                                            {formatCatalogPrice(
                                                String(
                                                    Number(line.unitPrice) *
                                                        line.quantity,
                                                ),
                                                line.currencyCode,
                                            )}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="border-t border-[#e5e7eb] bg-white px-5 py-5">
                    <div className="mb-4 rounded-2xl bg-[#f9fafb] px-4 py-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#6b7280]">
                                Total estimado
                            </span>
                            <span className="text-2xl font-black tabular-nums text-[#1f2937]">
                                {formatCatalogPrice(String(total), currencyCode)}
                            </span>
                        </div>
                    </div>

                    {!whatsappConfigured ? (
                        <p className="mb-3 rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
                            Configura el WhatsApp de pedidos en Administración →
                            Datos de la tienda.
                        </p>
                    ) : null}

                    <div className="flex flex-col gap-2.5">
                        <Button
                            type="button"
                            className="h-12 cursor-pointer rounded-2xl bg-[#25D366] text-base font-bold text-white shadow-lg shadow-emerald-300/30 hover:bg-[#20bd5a] disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!canCheckout || !checkoutUrl}
                            asChild={canCheckout && checkoutUrl ? true : undefined}
                        >
                            {canCheckout && checkoutUrl ? (
                                <a
                                    href={checkoutUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <MessageCircle className="mr-2 inline size-4" />
                                    Enviar pedido por WhatsApp
                                </a>
                            ) : (
                                <span>
                                    <MessageCircle className="mr-2 inline size-4" />
                                    Enviar pedido por WhatsApp
                                </span>
                            )}
                        </Button>
                        {lines.length > 0 ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 cursor-pointer rounded-2xl border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]"
                                onClick={onClear}
                            >
                                Vaciar carrito
                            </Button>
                        ) : null}
                    </div>
                </div>
            </aside>
        </>
    );
}
