import { usePage } from '@inertiajs/react';
import CompanyBrand from '@/components/company-brand';
import type { CompanyBranding } from '@/types/company';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const company = usePage().props.company as CompanyBranding;

    const backgroundStyle = company.login_background
        ? {
              backgroundImage: `url(${company.login_background})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
          }
        : undefined;

    return (
        <div
            className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10"
            style={backgroundStyle}
        >
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8 rounded-xl border border-border/60 bg-card/95 p-8 shadow-sm backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <CompanyBrand showTagline={!company.logo_url} />

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
