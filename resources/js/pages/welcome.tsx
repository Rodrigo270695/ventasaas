import { Head, Link, usePage } from '@inertiajs/react';
import CompanyBrand from '@/components/company-brand';
import { dashboard, login } from '@/routes';
import type { CompanyBranding } from '@/types/company';

export default function Welcome() {
    const { auth, company } = usePage().props;
    const branding = company as CompanyBranding;

    return (
        <>
            <Head title="Catálogo" />
            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
                <header className="border-b border-amber-100/80 bg-white/80 backdrop-blur-sm">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                        <Link href="/" className="shrink-0">
                            <CompanyBrand />
                        </Link>
                        <nav className="flex items-center gap-3 text-sm">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                    className="rounded-md bg-violet-700 px-4 py-2 font-medium text-white hover:bg-violet-800"
                            >
                                    Panel
                            </Link>
                        ) : (
                                <Link
                                    href={login()}
                                    className="rounded-md border border-violet-200 px-4 py-2 font-medium text-violet-800 hover:bg-violet-50"
                                >
                                    Acceso personal
                                </Link>
                        )}
                    </nav>
                    </div>
                </header>

                <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                    <section className="mb-10 text-center">
                        <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                            {branding.tagline ?? 'Nuestros productos'}
                            </h1>
                        <p className="mt-2 text-muted-foreground">
                            Elige lo que quieras y realiza tu pedido.
                        </p>
                    </section>

                    <section
                        aria-label="Catálogo de productos"
                        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                        <div className="col-span-full rounded-xl border border-dashed border-amber-200 bg-white/60 px-6 py-16 text-center">
                            <p className="text-lg font-medium text-gray-800">
                                Catálogo en preparación
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Aquí se mostrarán todos los productos disponibles
                                para vender. Lo conectaremos cuando tengamos el
                                módulo de inventario.
                            </p>
                        </div>
                    </section>
                    </main>
            </div>
        </>
    );
}
