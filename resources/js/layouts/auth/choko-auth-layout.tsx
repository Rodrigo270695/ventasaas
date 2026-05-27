import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import ChokoAuthBackground from '@/components/auth/choko-auth-background';
import { home } from '@/routes';
import type { CompanyBranding } from '@/types/company';

type Props = {
    children: ReactNode;
    title?: string;
    description?: string;
};

export default function ChokoAuthLayout({
    children,
    title = 'Acceso al sistema',
    description = 'Solo personal autorizado',
}: Props) {
    const company = usePage().props.company as CompanyBranding;

    return (
        <div className="choko-auth-page choko-auth-grain relative flex min-h-svh items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-10">
            <ChokoAuthBackground />

            <div className="relative z-10 w-full max-w-[440px]">
                <div className="choko-card-aura pointer-events-none absolute -inset-3 rounded-[2.25rem] sm:-inset-4" aria-hidden />
                <div className="choko-card choko-card-glass relative overflow-hidden rounded-4xl backdrop-blur-2xl">
                    <div className="choko-card-header-bg" aria-hidden />
                    <div className="relative px-7 pt-8 pb-2 sm:px-9 sm:pt-9">
                        <header className="flex flex-col items-center text-center">
                            <div className="choko-logo-stage relative mb-6 flex w-full justify-center rounded-3xl px-4 py-5">
                                {company.logo_url ? (
                                    <Link
                                        href={home()}
                                        className="relative z-10 transition-transform duration-500 ease-out hover:scale-[1.03] active:scale-[0.98]"
                                    >
                                        <img
                                            src={encodeURI(company.logo_url)}
                                            alt={company.name}
                                            className="h-[88px] w-auto max-w-[240px] object-contain drop-shadow-[0_12px_28px_rgba(91,33,182,0.2)] sm:h-[100px]"
                                        />
                                    </Link>
                                ) : (
                                    <Link
                                        href={home()}
                                        className="text-2xl font-extrabold text-[#5b21b6]"
                                    >
                                        {company.name}
                                    </Link>
                                )}
                            </div>

                            <span className="mb-2 inline-flex items-center rounded-full border border-violet-200/80 bg-white/80 px-3.5 py-1 text-[11px] font-bold tracking-[0.12em] text-[#7c3aed] uppercase shadow-sm">
                                {title}
                            </span>
                            {description && (
                                <p className="max-w-[280px] text-sm leading-relaxed text-[#7c6f8a]">
                                    {description}
                                </p>
                            )}
                        </header>
                    </div>

                    <div className="choko-form-panel mx-4 mb-4 rounded-3xl px-5 py-6 sm:mx-5 sm:px-6 sm:py-7">
                        {children}
                    </div>

                    <footer className="border-t border-violet-100/60 px-7 py-5 sm:px-9">
                        <Link
                            href={home()}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-100/90 bg-white/50 py-3 text-sm font-semibold text-[#6d28d9] transition-all hover:border-violet-200 hover:bg-white hover:shadow-md hover:shadow-violet-100/80"
                        >
                            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                            Volver al catálogo
                        </Link>
                    </footer>
                </div>

                <p className="mt-5 text-center text-[11px] font-medium tracking-wide text-[#9d8fb0]">
                    © {new Date().getFullYear()} {company.name}
                </p>
            </div>
        </div>
    );
}
