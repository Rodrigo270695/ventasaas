import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { navGroupTourId } from '@/config/admin-tour';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavGroup } from '@/types';

function groupHasActiveChild(
    group: NavGroup,
    isCurrentOrParentUrl: ReturnType<
        typeof useCurrentUrl
    >['isCurrentOrParentUrl'],
): boolean {
    return group.items.some(
        (item) => item.href && isCurrentOrParentUrl(item.href),
    );
}

export function NavCollapsibleGroup({ group }: { group: NavGroup }) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const isGroupActive = groupHasActiveChild(group, isCurrentOrParentUrl);

    return (
        <SidebarMenuItem
            className="mb-1"
            data-tour={`nav-group-${navGroupTourId(group.title)}`}
        >
            <Collapsible
                defaultOpen={group.defaultOpen ?? isGroupActive}
                className="group/collapsible w-full"
            >
                <div
                    className={cn(
                        'choko-nav-group-shell rounded-xl transition-all duration-300',
                        'group-data-[state=open]/collapsible:border group-data-[state=open]/collapsible:border-violet-200/80',
                        'group-data-[state=open]/collapsible:bg-white/70',
                        'group-data-[state=open]/collapsible:shadow-sm group-data-[state=open]/collapsible:shadow-violet-200/40',
                        isGroupActive &&
                            'border border-violet-200/70 bg-white/60 shadow-sm shadow-violet-200/30',
                    )}
                >
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            tooltip={{ children: group.title }}
                            className={cn(
                                'choko-nav-group-trigger h-10 cursor-pointer rounded-xl px-2.5 transition-all duration-200',
                                'hover:bg-violet-100/70',
                                'group-data-[state=open]/collapsible:bg-violet-50/80',
                                isGroupActive &&
                                    'font-semibold text-[#6d28d9]',
                            )}
                        >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#fce7f3] to-[#ede9fe] text-[#7c3aed] shadow-sm ring-1 ring-violet-200/60 transition-transform duration-200 group-data-[state=open]/collapsible:scale-105">
                                <group.icon className="size-4" strokeWidth={2.25} />
                            </span>
                            <span className="font-semibold tracking-tight">
                                {group.title}
                            </span>
                            <span className="ml-auto flex size-6 items-center justify-center rounded-md bg-violet-100/80 text-[#8b5cf6] transition-colors duration-200 group-data-[state=open]/collapsible:bg-violet-200/80">
                                <ChevronRight className="size-3.5 transition-transform duration-300 ease-out group-data-[state=open]/collapsible:rotate-90" />
                            </span>
                        </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="choko-nav-collapse-content">
                        <SidebarMenuSub className="choko-nav-sub mx-1.5 mb-2.5 mt-1 gap-1 border-0 px-0 py-2">
                            {group.items.map((item) => {
                                const active =
                                    item.href &&
                                    isCurrentOrParentUrl(item.href);

                                return (
                                    <SidebarMenuSubItem
                                        key={item.title}
                                        className="px-1"
                                    >
                                        {item.soon || !item.href ? (
                                            <SidebarMenuSubButton
                                                className={cn(
                                                    'choko-nav-sub-soon h-auto min-h-9 w-full cursor-default rounded-lg px-3 py-2',
                                                    'transition-colors duration-150',
                                                    'hover:bg-violet-50/60',
                                                )}
                                            >
                                                <span className="flex w-full min-w-0 items-center gap-3">
                                                    <span className="choko-nav-sub-dot size-2 shrink-0 rounded-full bg-violet-300/70" />
                                                    <span className="min-w-0 flex-1 truncate text-[13px] leading-snug text-[#6b5b7a]">
                                                        {item.title}
                                                    </span>
                                                    <span className="shrink-0 rounded-full bg-linear-to-r from-violet-100 to-fuchsia-100 px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#7c3aed] uppercase ring-1 ring-violet-200/50">
                                                        Pronto
                                                    </span>
                                                </span>
                                            </SidebarMenuSubButton>
                                        ) : (
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={!!active}
                                                className="choko-nav-sub-link h-auto min-h-9 w-full translate-x-0 cursor-pointer rounded-lg px-3 py-2 transition-all duration-150"
                                            >
                                                <Link
                                                    href={item.href}
                                                    prefetch
                                                    className="flex w-full min-w-0 items-center gap-3"
                                                >
                                                    <span
                                                        className={cn(
                                                            'choko-nav-sub-dot size-2 shrink-0 rounded-full transition-all duration-200',
                                                            active
                                                                ? 'bg-[#ec4899] shadow-[0_0_5px_rgba(236,72,153,0.45)]'
                                                                : 'bg-violet-300/70',
                                                        )}
                                                    />
                                                    <span className="min-w-0 flex-1 truncate text-[13px] leading-snug">
                                                        {item.title}
                                                    </span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        )}
                                    </SidebarMenuSubItem>
                                );
                            })}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </div>
            </Collapsible>
        </SidebarMenuItem>
    );
}
