import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck, Sparkles, Store, Truck } from 'lucide-react';
import type { ReactNode } from 'react';
import CompanyBrand from '@/components/company-brand';
import { home } from '@/routes';
import type { CompanyBranding } from '@/types/company';

type Props = {
    children: ReactNode;
    title?: string;
    description?: string;
};

const highlights = [
    {
        icon: Store,
        title: 'Catálogo en vivo',
        text: 'Tu vitrina pública siempre actualizada.',
    },
    {
        icon: Truck,
        title: 'Inventario centralizado',
        text: 'Stock, precios y variantes en un solo lugar.',
    },
    {
        icon: ShieldCheck,
        title: 'Acceso seguro',
        text: 'Solo personal autorizado del equipo.',
    },
];

export default function ChokoLoginLayout({
    children,
    title = 'Panel interno',
    description = 'Acceso exclusivo para el equipo de trabajo',
}: Props) {
    const company = usePage().props.company as CompanyBranding;

    return (
        <div className="relative min-h-svh overflow-hidden bg-[#f7f3ff] font-[family-name:var(--font-nunito,'Nunito',ui-sans-serif)] text-[#2e1065]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 -left-24 size-[28rem] rounded-full bg-[#ec4899]/20 blur-3xl" />
                <div className="absolute top-[20%] -right-20 size-[24rem] rounded-full bg-[#7c3aed]/25 blur-3xl" />
                <div className="absolute bottom-0 left-[30%] size-[20rem] rounded-full bg-[#d946ef]/15 blur-3xl" />
            </div>

            <div className="relative z-10 grid min-h-svh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
                    <div className="absolute inset-0 bg-linear-to-br from-[#12061f] via-[#2e1065] to-[#4c1d95]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.35),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(124,58,237,0.4),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(217,70,239,0.25),transparent_50%)]" />
                    <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />

                    <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-14">
                        <div>
                            <Link
                                href={home()}
                                className="inline-flex scale-95 transition hover:scale-100"
                            >
                                <CompanyBrand className="brightness-0 invert" />
                            </Link>

                            <div className="mt-14 max-w-md">
                                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-violet-100 uppercase backdrop-blur-sm">
                                    <Sparkles className="size-3.5 text-[#f9a8d4]" />
                                    {title}
                                </span>
                                <h1 className="mt-5 text-4xl leading-tight font-extrabold tracking-tight text-white xl:text-[2.75rem]">
                                    Tu tienda,
                                    <span className="block bg-linear-to-r from-[#fbcfe8] via-[#f0abfc] to-[#c4b5fd] bg-clip-text text-transparent">
                                        bajo control total
                                    </span>
                                </h1>
                                <p className="mt-4 max-w-sm text-base leading-relaxed text-violet-100/85">
                                    {description}
                                </p>
                            </div>
                        </div>

                        <ul className="mt-10 space-y-4">
                            {highlights.map(({ icon: Icon, title: itemTitle, text }) => (
                                <li
                                    key={itemTitle}
                                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#ec4899] to-[#7c3aed] text-white shadow-[0_10px_24px_-12px_rgba(236,72,153,0.8)]">
                                        <Icon className="size-[18px]" />
                                    </span>
                                    <div>
                                        <p className="font-bold text-white">
                                            {itemTitle}
                                        </p>
                                        <p className="mt-0.5 text-sm text-violet-100/75">
                                            {text}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <p className="mt-10 text-xs font-medium tracking-wide text-violet-200/60">
                            © {new Date().getFullYear()} {company.name}
                        </p>
                    </div>
                </aside>

                <main className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
                    <div className="w-full max-w-[440px]">
                        <div className="mb-6 flex flex-col items-center text-center lg:hidden">
                            <Link href={home()} className="mb-5">
                                <CompanyBrand />
                            </Link>
                            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/90 px-3.5 py-1 text-[11px] font-bold tracking-[0.12em] text-[#7c3aed] uppercase shadow-sm">
                                <Sparkles className="size-3.5 text-[#ec4899]" />
                                {title}
                            </span>
                            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#7c6f8a]">
                                {description}
                            </p>
                        </div>

                        <div className="relative">
                            <div
                                className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-linear-to-br from-[#ec4899]/25 via-[#d946ef]/20 to-[#7c3aed]/25 blur-2xl"
                                aria-hidden
                            />
                            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/95 shadow-[0_24px_60px_-28px_rgba(76,29,149,0.45)] backdrop-blur-xl">
                                <div className="h-1.5 bg-linear-to-r from-[#ec4899] via-[#d946ef] to-[#7c3aed]" />
                                <div className="px-6 py-7 sm:px-8 sm:py-8">
                                    {children}
                                </div>
                                <div className="border-t border-violet-100/80 px-6 py-4 sm:px-8">
                                    <Link
                                        href={home()}
                                        className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-violet-100 bg-[#faf5ff]/80 py-3 text-sm font-semibold text-[#6d28d9] transition hover:border-violet-200 hover:bg-white hover:shadow-md hover:shadow-violet-100/80"
                                    >
                                        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                                        Volver al catálogo
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
