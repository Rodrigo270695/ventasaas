import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WelcomeHeroSlide } from '@/types/welcome';

type Props = {
    slides: WelcomeHeroSlide[];
    storeName: string;
    tagline?: string | null;
    whatsappConfigured: boolean;
    onExploreCatalog: () => void;
    onOpenCart: () => void;
};

const AUTOPLAY_MS = 6000;

export function WelcomeHeroCarousel({
    slides,
    storeName,
    tagline,
    whatsappConfigured,
    onExploreCatalog,
    onOpenCart,
}: Props) {
    const [activeIndex, setActiveIndex] = useState(0);
    const hasSlides = slides.length > 0;

    const goTo = useCallback(
        (index: number) => {
            if (!hasSlides) {
                return;
            }

            const normalized =
                ((index % slides.length) + slides.length) % slides.length;
            setActiveIndex(normalized);
        },
        [hasSlides, slides.length],
    );

    const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
    const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

    useEffect(() => {
        if (!hasSlides || slides.length <= 1) {
            return;
        }

        const timer = window.setInterval(goNext, AUTOPLAY_MS);

        return () => window.clearInterval(timer);
    }, [hasSlides, slides.length, goNext]);

    const activeSlide = hasSlides ? slides[activeIndex] : null;

    return (
        <section className="relative w-full overflow-hidden">
            <div className="relative min-h-[72vh] w-full sm:min-h-[78vh] lg:min-h-[82vh]">
                {hasSlides ? (
                    slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className={cn(
                                'absolute inset-0 transition-opacity duration-700 ease-out',
                                index === activeIndex
                                    ? 'opacity-100'
                                    : 'pointer-events-none opacity-0',
                            )}
                            aria-hidden={index !== activeIndex}
                        >
                            <img
                                src={slide.image_url}
                                alt={slide.title ?? storeName}
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-linear-to-r from-[#12061f]/85 via-[#2e1065]/55 to-[#2e1065]/20" />
                            <div className="absolute inset-0 bg-linear-to-t from-[#12061f]/70 via-transparent to-[#12061f]/15" />
                        </div>
                    ))
                ) : (
                    <>
                        <div className="absolute inset-0 bg-linear-to-br from-[#1a0533] via-[#4c1d95] to-[#7c3aed]" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.35),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.12),transparent_35%)]" />
                        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
                    </>
                )}

                <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:items-center lg:pb-24">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#fce7f3] backdrop-blur-md">
                            <Sparkles className="size-3.5 text-[#fde047]" />
                            Dulcería premium
                        </div>

                        <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                            {activeSlide?.title ?? storeName}
                        </h1>

                        <p className="mt-5 max-w-2xl text-base leading-relaxed text-violet-100/90 sm:text-xl">
                            {activeSlide?.subtitle ??
                                tagline ??
                                'Explora nuestros productos, arma tu pedido y confírmalo por WhatsApp en minutos.'}
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button
                                type="button"
                                onClick={onExploreCatalog}
                                className="h-12 cursor-pointer rounded-2xl bg-white px-6 font-bold text-[#5b21b6] shadow-xl hover:bg-violet-50"
                            >
                                Explorar catálogo
                                <ArrowRight className="ml-2 size-4" />
                            </Button>
                            <Button
                                type="button"
                                onClick={onOpenCart}
                                variant="outline"
                                className="h-12 cursor-pointer rounded-2xl border-white/25 bg-white/10 px-6 font-semibold text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
                            >
                                Ver carrito
                            </Button>
                            {whatsappConfigured ? (
                                <div className="inline-flex h-12 items-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-50 backdrop-blur-sm">
                                    <MessageCircle className="size-4" />
                                    Pedidos por WhatsApp
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {hasSlides && slides.length > 1 ? (
                    <>
                        <button
                            type="button"
                            onClick={goPrev}
                            className="absolute top-1/2 left-4 z-10 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-md transition hover:bg-black/40"
                            aria-label="Anterior"
                        >
                            <ChevronLeft className="size-5" />
                        </button>
                        <button
                            type="button"
                            onClick={goNext}
                            className="absolute top-1/2 right-4 z-10 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-md transition hover:bg-black/40"
                            aria-label="Siguiente"
                        >
                            <ChevronRight className="size-5" />
                        </button>

                        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                            {slides.map((slide, index) => (
                                <button
                                    key={slide.id}
                                    type="button"
                                    onClick={() => goTo(index)}
                                    className={cn(
                                        'h-2.5 cursor-pointer rounded-full transition-all duration-300',
                                        index === activeIndex
                                            ? 'w-8 bg-white'
                                            : 'w-2.5 bg-white/45 hover:bg-white/70',
                                    )}
                                    aria-label={`Ir a slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                ) : null}
            </div>
        </section>
    );
}
