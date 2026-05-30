import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { CompanyBranding } from '@/types/company';

export function WelcomeNavbarBrand() {
    const company = usePage().props.company as CompanyBranding;

    return (
        <Link
            href="/"
            className="inline-flex max-w-[10rem] shrink-0 items-center gap-2 transition sm:max-w-[11rem]"
        >
            {company.logo_url ? (
                <img
                    src={encodeURI(company.logo_url)}
                    alt={company.name}
                    className="h-8 w-full object-contain object-left sm:h-9"
                />
            ) : (
                <>
                    <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#fff7ed]"
                        style={{ color: company.primary_color }}
                    >
                        <AppLogoIcon className="size-5 object-contain" />
                    </span>
                    <span className="truncate text-base font-extrabold text-[#1f2937]">
                        {company.name}
                    </span>
                </>
            )}
        </Link>
    );
}
