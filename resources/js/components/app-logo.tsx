import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { CompanyBranding } from '@/types/company';

export default function AppLogo() {
    const company = usePage().props.company as CompanyBranding;

    return (
        <>
            {company.logo_url ? (
                <img
                    src={encodeURI(company.logo_url)}
                    alt={company.name}
                    className="h-9 w-auto max-w-[130px] shrink-0 object-contain"
                />
            ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#ec4899] to-[#7c3aed] shadow-md shadow-violet-300/40">
                    <AppLogoIcon className="size-5 object-contain" />
                </div>
            )}
            <div className="ml-2 grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-extrabold text-[#4c1d95]">
                    {company.name}
                </span>
                <span className="truncate text-[10px] font-bold tracking-wider text-[#a78bfa] uppercase">
                    Panel admin
                </span>
            </div>
        </>
    );
}
