import { Link } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCloseMobileSidebar } from '@/hooks/use-close-mobile-sidebar';
import { dashboard } from '@/routes';

export function AppSidebar() {
    const closeMobileSidebar = useCloseMobileSidebar();

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="choko-sidebar border-violet-200/70"
        >
            <SidebarHeader className="px-2 py-3" data-tour="sidebar-brand">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="h-auto min-h-12 hover:bg-violet-100/80"
                        >
                            <Link
                                href={dashboard()}
                                prefetch
                                onClick={closeMobileSidebar}
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-1 overflow-y-auto px-1 pb-2">
                <NavMain />
            </SidebarContent>

            <SidebarFooter className="gap-1 px-1 pb-3" data-tour="nav-user">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
