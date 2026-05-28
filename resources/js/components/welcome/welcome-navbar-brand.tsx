import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { CompanyBranding } from '@/types/company';

export function WelcomeNavbarBrand() {
    const company = usePage().props.company as CompanyBranding;

    return (
        <Link
            href="/"
            className="inline-flex max-w-[11rem] items-center rounded-2xl bg-white/95 px-3 py-1.5 shadow-[0_8px_22px_-10px_rgba(0,0,0,0.45)] ring-1 ring-white/70 transition hover:bg-white sm:max-w-[9.5rem]"
        >
            {company.logo_url ? (
                <img
                    src={encodeURI(company.logo_url)}
                    alt={company.name}
                    className="h-8 w-full object-contain object-left"
                />
            ) : (
                <span className="flex items-center gap-2">
                    <span
                        className="flex size-7 shrink-0 items-center justify-center"
                        style={{ color: company.primary_color }}
                    >
                        <AppLogoIcon className="size-7 object-contain" />
                    </span>
                    <span className="truncate text-sm font-extrabold text-[#7c3aed]">
                        {company.name}
                    </span>
                </span>
            )}
        </Link>
    );
}
