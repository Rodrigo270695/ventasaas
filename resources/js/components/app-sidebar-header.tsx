import { Breadcrumbs } from '@/components/breadcrumbs';
import { useAdminLayoutTour } from '@/components/onboarding/admin-layout-tour';
import { useAdminPageTour } from '@/components/onboarding/admin-page-tour';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { CircleHelp } from 'lucide-react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { startTour: startLayoutTour } = useAdminLayoutTour();
    const { startPageTour, currentTour } = useAdminPageTour();

    const handleGuideClick = () => {
        if (currentTour) {
            startPageTour();

            return;
        }

        startLayoutTour();
    };

    return (
        <header className="choko-admin-header z-30 flex h-16 shrink-0 items-center gap-2 border-b border-violet-100/60 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <SidebarTrigger
                    className="-ml-1"
                    data-tour="sidebar-trigger"
                />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 cursor-pointer gap-1.5 text-[#7c3aed] hover:bg-violet-50 hover:text-[#6d28d9]"
                data-tour="tour-help-button"
                onClick={handleGuideClick}
                title={
                    currentTour
                        ? 'Guía de esta pantalla'
                        : 'Guía del panel'
                }
            >
                <CircleHelp className="size-4" />
                <span className="hidden sm:inline">Ver guía</span>
            </Button>
        </header>
    );
}
