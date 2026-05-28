import { Link } from '@inertiajs/react';
import { Sparkles, User, Shield } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: (NavItem & { icon: typeof User })[] = [
    {
        title: 'Perfil',
        href: edit(),
        icon: User,
    },
    {
        title: 'Seguridad',
        href: editSecurity(),
        icon: Shield,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pb-8 md:p-6">
            <header className="space-y-2 border-b border-violet-100 pb-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#7c3aed] uppercase">
                    <Sparkles className="size-3.5 text-[#ec4899]" />
                    Mi cuenta
                </span>
                <h1 className="text-2xl font-black tracking-tight text-[#4c1d95] md:text-3xl">
                    Configuración
                </h1>
                <p className="max-w-2xl text-sm text-[#7c6f8a]">
                    Gestiona tu perfil y la seguridad de tu cuenta.
                </p>
            </header>

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                <aside className="w-full shrink-0 lg:w-52">
                    <nav
                        className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0"
                        aria-label="Configuración"
                    >
                        {sidebarNavItems.map((item) => {
                            const active = isCurrentOrParentUrl(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={toUrl(item.href)}
                                    href={item.href}
                                    className={cn(
                                        'inline-flex shrink-0 cursor-pointer items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-bold transition',
                                        active
                                            ? 'bg-linear-to-r from-[#ec4899] to-[#7c3aed] text-white shadow-[0_10px_24px_-12px_rgba(124,58,237,0.75)]'
                                            : 'border border-violet-200/80 bg-white text-[#6d28d9] hover:border-violet-300 hover:bg-violet-50',
                                    )}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <div className="min-w-0 flex-1 md:max-w-2xl">
                    <section className="space-y-6">{children}</section>
                </div>
            </div>
        </div>
    );
}
