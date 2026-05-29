import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { NoIndexHead } from '@/components/seo/no-index-head';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <NoIndexHead />
            {children}
        </AppLayoutTemplate>
    );
}
