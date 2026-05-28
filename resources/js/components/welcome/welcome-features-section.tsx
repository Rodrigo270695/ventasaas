import { ShoppingCart, Sparkles, Store, Truck } from 'lucide-react';
import { WelcomeFeatureCard } from '@/components/welcome/welcome-feature-card';

const features = [
    {
        icon: Store,
        title: 'Catálogo por categorías',
        text: 'Encuentra rápido lo que buscas.',
    },
    {
        icon: ShoppingCart,
        title: 'Carrito',
        text: 'Arma tu pedido antes de enviarlo.',
    },
    {
        icon: Truck,
        title: 'WhatsApp',
        text: 'Confirma tu pedido en un mensaje.',
    },
] as const;

export function WelcomeFeaturesSection() {
    return (
        <section className="mt-16 sm:mt-20">
            <div className="mb-8 text-center sm:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#fbcfe8] bg-white px-3 py-1 text-[10px] font-black tracking-[0.16em] text-[#db2777] uppercase">
                    <Sparkles className="size-3.5 text-[#ec4899]" />
                    Cómo funciona
                </span>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-[#831843] sm:text-3xl">
                    Elige, agrega y pide
                </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                    <WelcomeFeatureCard key={feature.title} {...feature} />
                ))}
            </div>
        </section>
    );
}
