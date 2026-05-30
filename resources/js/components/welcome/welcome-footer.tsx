import { ArrowUpRight, MessageCircle } from 'lucide-react';
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
        <footer className="mt-12 border-t border-[#e5e7eb] bg-white pb-24 md:pb-12">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
                    <div>
                        <CompanyBrand />
                        {tagline ? (
                            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#6b7280]">
                                {tagline}
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <p className="text-xs font-bold tracking-wide text-[#9ca3af] uppercase">
                            Navegación
                        </p>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <button
                                    type="button"
                                    onClick={onScrollToCatalog}
                                    className="cursor-pointer text-sm font-semibold text-[#374151] transition hover:text-[#f97316]"
                                >
                                    Catálogo de productos
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-5">
                        <p className="text-base font-bold text-[#1f2937]">
                            ¿Listo para pedir?
                        </p>
                        <p className="mt-1 text-sm text-[#6b7280]">
                            Envía tu selección por WhatsApp
                        </p>
                        {contactUrl ? (
                            <a
                                href={contactUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#20bd5a]"
                            >
                                <MessageCircle className="size-4" />
                                Pedir por WhatsApp
                                <ArrowUpRight className="size-4 opacity-80" />
                            </a>
                        ) : null}
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-[#f3f4f6] pt-6 text-center sm:flex-row sm:text-left">
                    <p className="text-xs text-[#9ca3af]">
                        © {new Date().getFullYear()} {storeName}
                    </p>
                </div>
            </div>
        </footer>
    );
}
