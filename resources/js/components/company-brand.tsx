import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { CompanyBranding } from '@/types/company';

type Props = {
    className?: string;
    showTagline?: boolean;
};

export default function CompanyBrand({
    className = '',
    showTagline = false,
}: Props) {
    const company = usePage().props.company as CompanyBranding;

    return (
        <div className={`flex flex-col items-center gap-2 text-center ${className}`}>
            {company.logo_url ? (
                <img
                    src={encodeURI(company.logo_url)}
                    alt={company.name}
                    className="h-20 w-auto max-w-[280px] object-contain"
                />
            ) : (
                <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ color: company.primary_color }}
                >
                    <AppLogoIcon className="size-10 object-contain" />
                </div>
            )}
            {!company.logo_url && (
                <span className="text-lg font-semibold tracking-tight">
                    {company.name}
                </span>
            )}
            {showTagline && company.tagline && (
                <p className="max-w-xs text-sm text-muted-foreground">
                    {company.tagline}
                </p>
            )}
        </div>
    );
}
