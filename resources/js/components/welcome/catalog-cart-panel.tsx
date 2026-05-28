import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
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
                    'fixed inset-0 z-40 bg-[#1e1033]/40 backdrop-blur-[2px] transition-opacity duration-300',
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
                    'border-l border-violet-200/80 bg-white shadow-2xl shadow-violet-950/20',
                    'transition-transform duration-300 ease-out',
                    open ? 'translate-x-0' : 'translate-x-full',
                )}
                aria-hidden={!open}
                aria-label="Carrito de compras"
            >
                <div className="flex items-center justify-between border-b border-violet-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-[#7c3aed]">
                            <ShoppingCart className="size-4" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#2e1065]">
                                Tu pedido
                            </h2>
                            <p className="text-xs text-[#7c6f8a]">
                                {itemCount}{' '}
                                {itemCount === 1 ? 'producto' : 'productos'}
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 cursor-pointer rounded-xl text-[#7c6f8a] hover:bg-violet-50"
                        onClick={() => onOpenChange(false)}
                        aria-label="Cerrar carrito"
                    >
                        <X className="size-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {lines.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 px-6 py-12 text-center">
                            <ShoppingCart className="size-10 text-[#c4b5fd]" />
                            <p className="mt-3 text-sm font-medium text-[#4c1d95]">
                                Tu carrito está vacío
                            </p>
                            <p className="mt-1 text-xs text-[#7c6f8a]">
                                Agrega productos del catálogo para armar tu
                                pedido.
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {lines.map((line) => (
                                <li
                                    key={line.key}
                                    className="rounded-2xl border border-violet-100 bg-violet-50/30 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-[#2e1065]">
                                                {line.productName}
                                            </p>
                                            {line.variantLabel ? (
                                                <p className="mt-0.5 text-xs text-[#7c6f8a]">
                                                    {line.variantLabel}
                                                </p>
                                            ) : null}
                                            <p className="mt-1 font-mono text-[11px] text-[#9d8fb0]">
                                                {line.sku}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 shrink-0 cursor-pointer rounded-lg text-red-500 hover:bg-red-50"
                                            onClick={() =>
                                                onRemoveLine(line.key)
                                            }
                                            aria-label="Quitar del carrito"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-1 py-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 cursor-pointer rounded-lg"
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
                                            <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-[#4c1d95]">
                                                {line.quantity}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 cursor-pointer rounded-lg"
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
                                        <p className="text-sm font-bold tabular-nums text-[#4c1d95]">
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

                <div className="border-t border-violet-100 px-5 py-4">
                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#6b5b7a]">
                            Total estimado
                        </span>
                        <span className="text-xl font-bold tabular-nums text-[#4c1d95]">
                            {formatCatalogPrice(String(total), currencyCode)}
                        </span>
                    </div>

                    {!whatsappConfigured ? (
                        <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                            Configura el WhatsApp de pedidos en Administración →
                            Datos de la tienda.
                        </p>
                    ) : null}

                    <div className="flex flex-col gap-2">
                        <Button
                            type="button"
                            className="h-11 cursor-pointer rounded-xl bg-[#25D366] font-bold text-white hover:bg-[#20bd5a] disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!canCheckout || !checkoutUrl}
                            asChild={canCheckout && checkoutUrl ? true : undefined}
                        >
                            {canCheckout && checkoutUrl ? (
                                <a
                                    href={checkoutUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Enviar pedido por WhatsApp
                                </a>
                            ) : (
                                <span>Enviar pedido por WhatsApp</span>
                            )}
                        </Button>
                        {lines.length > 0 ? (
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer rounded-xl border-violet-200 text-[#6d28d9]"
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
