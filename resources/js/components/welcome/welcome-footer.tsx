import { ArrowUpRight, MessageCircle, Sparkles } from 'lucide-react';
import CompanyBrand from '@/components/company-brand';
import { buildWhatsappCheckoutUrl } from '@/lib/whatsapp-order';

type Props = {
    storeName: string;
    tagline?: string | null;
    whatsappNumber?: string | null;
    checkoutUrl?: string | null;
    onScrollToCatalog: () => void;
};

export function WelcomeFooter({
    storeName,
    tagline,
    whatsappNumber,
    checkoutUrl,
    onScrollToCatalog,
}: Props) {
    const contactUrl =
        checkoutUrl ??
        (whatsappNumber
            ? buildWhatsappCheckoutUrl(
                  whatsappNumber,
                  `Hola, me gustaría consultar sobre los productos de *${storeName}*.`,
              )
            : null);

    return (
        <footer className="relative mt-10 border-t-4 border-[#fbcfe8] bg-white/90 backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#fde047] via-[#fb7185] to-[#c084fc]" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-14">
                <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_1fr] lg:gap-12">
                    <div>
                        <CompanyBrand />
                        {tagline ? (
                            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#be185d]/80">
                                {tagline}
                            </p>
                        ) : null}
                        <p className="mt-4 text-xs font-black tracking-wide text-[#db2777] uppercase">
                            {storeName}
                        </p>
                    </div>

                    <div>
                        <p className="text-[11px] font-black tracking-[0.16em] text-[#db2777] uppercase">
                            Navegación
                        </p>
                        <ul className="mt-4 space-y-3">
                            <li>
                                <button
                                    type="button"
                                    onClick={onScrollToCatalog}
                                    className="cursor-pointer text-sm font-bold text-[#831843] transition hover:text-[#ec4899]"
                                >
                                    Catálogo de productos
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-[1.75rem] border-[3px] border-[#fbcfe8] bg-linear-to-br from-[#fff5f8] to-white p-5 shadow-[0_20px_50px_-30px_rgba(236,72,153,0.35)]">
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#fbcfe8] bg-white px-3 py-1 text-[10px] font-black tracking-[0.14em] text-[#db2777] uppercase">
                            <Sparkles className="size-3 text-[#ec4899]" />
                            Listo para pedir
                        </span>
                        <p className="mt-3 text-base font-black text-[#831843]">
                            ¿Ya tienes tu selección?
                        </p>
                        {contactUrl ? (
                            <a
                                href={contactUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-300/30 transition hover:bg-[#20bd5a]"
                            >
                                <MessageCircle className="size-4" />
                                Pedir por WhatsApp
                                <ArrowUpRight className="size-4 opacity-80" />
                            </a>
                        ) : null}
                    </div>
                </div>

                <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[#fce7f3] pt-6 text-center sm:flex-row sm:text-left">
                    <p className="text-xs text-[#be185d]/70">
                        © {new Date().getFullYear()} {storeName}
                    </p>
                    <p className="text-xs font-bold text-[#f472b6]">
                        Dulcería premium
                    </p>
                </div>
            </div>
        </footer>
    );
}
