import {
    MessageCircle,
    Minus,
    Plus,
    ShoppingCart,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
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
    return (
        <>
            <div
                className={cn(
                    'fixed inset-0 z-40 bg-[#12061f]/55 backdrop-blur-md transition-opacity duration-300',
                    open
                        ? 'pointer-events-auto opacity-100'
                        : 'pointer-events-none opacity-0',
                )}
                onClick={() => onOpenChange(false)}
                aria-hidden={!open}
            />

            <aside
                className={cn(
                    'fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col',
                    'bg-[#fcfbff] shadow-[-24px_0_80px_-20px_rgba(46,16,101,0.35)]',
                    'transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    open ? 'translate-x-0' : 'translate-x-full',
                )}
                aria-hidden={!open}
                aria-label="Carrito de compras"
            >
                <div className="relative overflow-hidden border-b border-violet-100 px-5 py-5">
                    <div className="absolute inset-0 bg-linear-to-br from-[#2e1065] via-[#5b21b6] to-[#7c3aed]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.35),transparent_55%)]" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white backdrop-blur-sm">
                                <ShoppingCart className="size-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
                                    Tu selección
                                </p>
                                <h2 className="text-xl font-bold text-white">
                                    Carrito
                                </h2>
                                <p className="text-xs text-violet-100/85">
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
                            className="size-10 cursor-pointer rounded-2xl text-white hover:bg-white/10"
                            onClick={() => onOpenChange(false)}
                            aria-label="Cerrar carrito"
                        >
                            <X className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5">
                    {lines.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-violet-200 bg-linear-to-b from-violet-50/80 to-white px-6 py-14 text-center">
                            <div className="flex size-16 items-center justify-center rounded-[1.25rem] bg-violet-100 text-[#7c3aed]">
                                <Sparkles className="size-7" />
                            </div>
                            <p className="mt-4 text-lg font-bold text-[#4c1d95]">
                                Arma tu pedido
                            </p>
                            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#7c6f8a]">
                                Explora el catálogo, agrega tus productos
                                favoritos y confírmalo por WhatsApp.
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {lines.map((line) => (
                                <li
                                    key={line.key}
                                    className="rounded-[1.35rem] border border-violet-100 bg-white p-4 shadow-[0_10px_30px_-24px_rgba(76,29,149,0.55)]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-bold text-[#2e1065]">
                                                {line.productName}
                                            </p>
                                            {line.variantLabel ? (
                                                <p className="mt-0.5 text-xs font-medium text-[#7c6f8a]">
                                                    {line.variantLabel}
                                                </p>
                                            ) : null}
                                            <p className="mt-1 font-mono text-[11px] text-[#b8aecf]">
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
                                        <div className="flex items-center gap-1 rounded-2xl border border-violet-200 bg-violet-50/60 p-1">
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
                                            <span className="min-w-8 text-center text-sm font-bold tabular-nums text-[#4c1d95]">
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
                                        <p className="text-base font-black tabular-nums text-[#4c1d95]">
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

                <div className="border-t border-violet-100 bg-white px-5 py-5">
                    <div className="mb-4 rounded-[1.25rem] bg-violet-50/80 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#6b5b7a]">
                                Total estimado
                            </span>
                            <span className="text-2xl font-black tabular-nums text-[#4c1d95]">
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
                                className="h-11 cursor-pointer rounded-2xl border-violet-200 text-[#6d28d9] hover:bg-violet-50"
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
