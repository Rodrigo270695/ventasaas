import { ShoppingCart, Store, Truck } from 'lucide-react';
import { WelcomeFeatureCard } from '@/components/welcome/welcome-feature-card';

const features = [
    {
        icon: Store,
        title: 'Catálogo por categorías',
        text: 'Encuentra rápido lo que buscas.',
    },
    {
        icon: ShoppingCart,
        title: 'Arma tu pedido',
        text: 'Agrega productos al carrito antes de enviarlo.',
    },
    {
        icon: Truck,
        title: 'Confirma por WhatsApp',
        text: 'Recibe atención personalizada al instante.',
    },
] as const;

export function WelcomeFeaturesSection() {
    return (
        <section className="mt-12 sm:mt-16">
            <div className="mb-6">
                <h2 className="text-xl font-black tracking-tight text-[#1f2937] sm:text-2xl">
                    ¿Cómo comprar?
                </h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                    Tres pasos simples para tu pedido
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => (
                    <WelcomeFeatureCard key={feature.title} {...feature} />
                ))}
            </div>
        </section>
    );
}
