import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    ShieldCheck,
    Truck,
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

const trustBadges = [
    { icon: Truck, label: 'Pedidos rápidos' },
    { icon: ShieldCheck, label: 'Compra segura' },
    { icon: MessageCircle, label: 'Atención por WhatsApp' },
] as const;

export function WelcomeHeroCarousel({
    slides,
    storeName,
    tagline,
    whatsappConfigured,
    onExploreCatalog,
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
        <section className="bg-[#f9fafb] px-4 py-4 sm:px-6 sm:py-6">
            <div className="mx-auto max-w-7xl">
                <div className="relative overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] sm:rounded-[2rem]">
                    <div className="relative min-h-[320px] w-full sm:min-h-[380px] lg:min-h-[420px]">
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
                                    <div className="absolute inset-0 bg-linear-to-r from-[#1f2937]/75 via-[#1f2937]/40 to-transparent" />
                                </div>
                            ))
                        ) : (
                            <div className="absolute inset-0 bg-linear-to-br from-[#fef3c7] via-[#fff7ed] to-[#ffedd5]" />
                        )}

                        <div className="relative flex h-full flex-col justify-end px-5 py-8 sm:px-10 sm:py-10 lg:max-w-xl lg:justify-center lg:py-12">
                            <h1 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                                {activeSlide?.title ?? storeName}
                            </h1>

                            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/90 sm:text-base">
                                {activeSlide?.subtitle ??
                                    tagline ??
                                    'Explora nuestros productos, arma tu pedido y confírmalo por WhatsApp en minutos.'}
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    onClick={onExploreCatalog}
                                    className="h-11 cursor-pointer rounded-full bg-[#f97316] px-6 font-bold text-white shadow-md shadow-orange-200 hover:bg-[#ea580c]"
                                >
                                    Ver productos
                                    <ArrowRight className="ml-2 size-4" />
                                </Button>
                                {whatsappConfigured ? (
                                    <span className="inline-flex h-11 items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 text-sm font-semibold text-white backdrop-blur-sm">
                                        <MessageCircle className="size-4" />
                                        Pedidos por WhatsApp
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        {hasSlides && slides.length > 1 ? (
                            <>
                                <button
                                    type="button"
                                    onClick={goPrev}
                                    className="absolute top-1/2 left-3 z-10 hidden size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#374151] shadow-md transition hover:bg-white sm:flex"
                                    aria-label="Anterior"
                                >
                                    <ChevronLeft className="size-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="absolute top-1/2 right-3 z-10 hidden size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#374151] shadow-md transition hover:bg-white sm:flex"
                                    aria-label="Siguiente"
                                >
                                    <ChevronRight className="size-5" />
                                </button>

                                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                                    {slides.map((slide, index) => (
                                        <button
                                            key={slide.id}
                                            type="button"
                                            onClick={() => goTo(index)}
                                            className={cn(
                                                'h-2 cursor-pointer rounded-full transition-all duration-300',
                                                index === activeIndex
                                                    ? 'w-6 bg-white'
                                                    : 'w-2 bg-white/50 hover:bg-white/75',
                                            )}
                                            aria-label={`Ir a slide ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
                    {trustBadges.map((badge) => (
                        <div
                            key={badge.label}
                            className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#e5e7eb] bg-white px-2 py-3 text-center sm:flex-row sm:justify-center sm:gap-2 sm:px-4"
                        >
                            <badge.icon className="size-4 shrink-0 text-[#f97316] sm:size-5" />
                            <span className="text-[10px] font-semibold text-[#374151] sm:text-xs">
                                {badge.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
