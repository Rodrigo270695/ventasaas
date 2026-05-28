import { Link, router, usePage } from '@inertiajs/react';
import {
    Boxes,
    FileCheck2,
    FileText,
    LayoutList,
    Package,
    ReceiptText,
    ShieldCheck,
    ShoppingCart,
    Sparkles,
    Users,
    Wallet,
    Warehouse,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { NavCollapsibleGroup } from '@/components/nav-collapsible-group';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { adminMainNavItem, adminNavGroups } from '@/config/admin-navigation';
import { useCan } from '@/hooks/use-can';
import { useCloseMobileSidebar } from '@/hooks/use-close-mobile-sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { filterNavGroups } from '@/lib/admin-navigation-access';
import {
    AUDIT_PERMISSIONS,
    CATEGORIES_PERMISSIONS,
    DOCUMENT_SERIES_PERMISSIONS,
    ELECTRONIC_DOCUMENTS_PERMISSIONS,
    PRODUCTS_PERMISSIONS,
    PURCHASES_PERMISSIONS,
    ROLES_PERMISSIONS,
    SALES_PERMISSIONS,
    SALES_QUOTATIONS_PERMISSIONS,
    STOCK_BALANCES_PERMISSIONS,
    STOCK_MOVEMENTS_PERMISSIONS,
    TREASURY_COLLECTIONS_PERMISSIONS,
    TREASURY_DISBURSEMENTS_PERMISSIONS,
    USERS_PERMISSIONS,
} from '@/lib/admin-permissions';
import type { NavItem } from '@/types';
import type { Auth } from '@/types/auth';

function NavMainLink({
    item,
    dataTour,
}: {
    item: NavItem;
    dataTour?: string;
}) {
    const { isCurrentUrl } = useCurrentUrl();
    const closeMobileSidebar = useCloseMobileSidebar();
    const active = isCurrentUrl(item.href);

    return (
        <SidebarMenuItem data-tour={dataTour}>
            <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={{ children: item.title }}
                className="cursor-pointer rounded-xl transition-all duration-200 hover:bg-violet-100/70"
            >
                <Link href={item.href} prefetch onClick={closeMobileSidebar}>
                    {item.icon && (
                        <item.icon className="size-4 text-[#7c3aed]" />
                    )}
                    <span>{item.title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export function NavMain({
    items,
    groups = adminNavGroups,
    mainItem = adminMainNavItem,
}: {
    items?: NavItem[];
    groups?: typeof adminNavGroups;
    mainItem?: NavItem;
}) {
    const { can, canAny } = useCan();
    const { auth } = usePage<{ auth: Auth }>().props;
    const [editingFavorites, setEditingFavorites] = useState(false);
    const legacyItems = items ?? [];
    const favoriteItems = useMemo<NavItem[]>(
        () =>
            [
                {
                    title: 'Productos',
                    href: '/admin/catalogo/productos',
                    icon: Package,
                    allowed: can(PRODUCTS_PERMISSIONS.VIEW),
                },
                {
                    title: 'Categorías',
                    href: '/admin/catalogo/categorias',
                    icon: LayoutList,
                    allowed: can(CATEGORIES_PERMISSIONS.VIEW),
                },
                {
                    title: 'Comprobantes',
                    href: '/admin/ventas/comprobantes',
                    icon: FileText,
                    allowed: can(SALES_PERMISSIONS.VIEW),
                },
                {
                    title: 'Cotizaciones',
                    href: '/admin/ventas/cotizaciones',
                    icon: FileCheck2,
                    allowed: can(SALES_QUOTATIONS_PERMISSIONS.VIEW),
                },
                {
                    title: 'Facturas compra',
                    href: '/admin/compras/facturas',
                    icon: ReceiptText,
                    allowed: can(PURCHASES_PERMISSIONS.VIEW),
                },
                {
                    title: 'Stock Por almacen',
                    href: '/admin/inventario/saldos',
                    icon: Warehouse,
                    allowed: can(STOCK_BALANCES_PERMISSIONS.VIEW),
                },
                {
                    title: 'Movimientos stock',
                    href: '/admin/inventario/movimientos',
                    icon: Boxes,
                    allowed: can(STOCK_MOVEMENTS_PERMISSIONS.VIEW),
                },
                {
                    title: 'Cuentas por cobrar',
                    href: '/admin/tesoreria/cuentas-por-cobrar',
                    icon: Wallet,
                    allowed: can(TREASURY_COLLECTIONS_PERMISSIONS.VIEW),
                },
                {
                    title: 'Cuentas por pagar',
                    href: '/admin/tesoreria/cuentas-por-pagar',
                    icon: Wallet,
                    allowed: can(TREASURY_DISBURSEMENTS_PERMISSIONS.VIEW),
                },
                {
                    title: 'CPE SUNAT',
                    href: '/admin/documentos/comprobantes-electronicos',
                    icon: ShoppingCart,
                    allowed: can(ELECTRONIC_DOCUMENTS_PERMISSIONS.VIEW),
                },
                {
                    title: 'Series',
                    href: '/admin/documentos/series',
                    icon: FileCheck2,
                    allowed: can(DOCUMENT_SERIES_PERMISSIONS.VIEW),
                },
                {
                    title: 'Usuarios',
                    href: '/admin/sistema/usuarios',
                    icon: Users,
                    allowed: can(USERS_PERMISSIONS.VIEW),
                },
                {
                    title: 'Roles',
                    href: '/admin/sistema/roles',
                    icon: Sparkles,
                    allowed: can(ROLES_PERMISSIONS.VIEW),
                },
                {
                    title: 'Auditoría',
                    href: '/admin/sistema/auditoria',
                    icon: ShieldCheck,
                    allowed: can(AUDIT_PERMISSIONS.VIEW),
                },
            ]
                .reduce<NavItem[]>((acc, item) => {
                    if (item.allowed) {
                        acc.push({
                            title: item.title,
                            href: item.href,
                            icon: item.icon,
                        });
                    }

                    return acc;
                }, []),
        [can],
    );
    const savedFavorites = useMemo(
        () =>
            Array.isArray(auth.user?.favorite_nav_items)
                ? (auth.user?.favorite_nav_items as string[])
                : [],
        [auth.user?.favorite_nav_items],
    );
    const selectedFavoriteHrefs = useMemo(
        () => savedFavorites.filter((href) => favoriteItems.some((item) => item.href === href)),
        [savedFavorites, favoriteItems],
    );
    const visibleFavorites = useMemo(
        () =>
            selectedFavoriteHrefs.length > 0
                ? favoriteItems.filter((item) =>
                      selectedFavoriteHrefs.includes(item.href as string),
                  )
                : favoriteItems.slice(0, 4),
        [favoriteItems, selectedFavoriteHrefs],
    );

    const toggleFavorite = (href: string, checked: boolean) => {
        const current = new Set(selectedFavoriteHrefs);

        if (checked) {
            if (current.size >= 4) {
                return;
            }

            current.add(href);
        } else {
            current.delete(href);
        }

        router.patch(
            '/settings/favorites',
            { favorites: [...current] },
            { preserveScroll: true, preserveState: true },
        );
    };

    const visibleGroups = useMemo(
        () => filterNavGroups(groups, can, canAny),
        [groups, can, canAny],
    );

    return (
        <>
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel className="text-[#a78bfa]">
                    Principal
                </SidebarGroupLabel>
                <SidebarMenu>
                    <NavMainLink item={mainItem} dataTour="nav-home" />
                    {legacyItems.map((item) => (
                        <NavMainLink key={item.title} item={item} />
                    ))}
                </SidebarMenu>
            </SidebarGroup>

            {favoriteItems.length > 0 ? (
                <SidebarGroup className="px-2 py-0" data-tour="nav-favorites">
                    <div className="mb-1 flex items-center justify-between rounded-lg border border-violet-200/60 bg-linear-to-r from-violet-50 to-fuchsia-50 px-2 py-1">
                        <SidebarGroupLabel className="text-[#a78bfa]">
                            Favoritos
                        </SidebarGroupLabel>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 cursor-pointer px-2 text-[11px] text-[#7c3aed] hover:bg-violet-100"
                            onClick={() => setEditingFavorites((prev) => !prev)}
                        >
                            {editingFavorites ? 'Cerrar' : 'Editar'}
                        </Button>
                    </div>
                    {editingFavorites ? (
                        <div className="mb-2 space-y-1 rounded-xl border border-violet-200/70 bg-violet-50/40 p-2 shadow-sm">
                            <p className="text-[10px] font-medium text-[#7c6f8a]">
                                Selecciona hasta 4 accesos directos.
                            </p>
                            {favoriteItems.map((item) => {
                                const href = item.href as string;
                                const checked = selectedFavoriteHrefs.includes(href);

                                return (
                                    <label key={href} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs text-[#4c1d95] hover:bg-white/70">
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={(value) => toggleFavorite(href, value === true)}
                                            className="cursor-pointer"
                                        />
                                        <span className="truncate">{item.title}</span>
                                    </label>
                                );
                            })}
                        </div>
                    ) : null}
                    <SidebarMenu>
                        {visibleFavorites.map((item) => (
                            <NavMainLink key={item.title} item={item} />
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ) : null}

            <SidebarGroup className="px-2 py-0" data-tour="nav-modules">
                <SidebarGroupLabel className="text-[#a78bfa]">
                    Módulos
                </SidebarGroupLabel>
                <SidebarMenu className="gap-0.5">
                    {visibleGroups.map((group) => (
                        <NavCollapsibleGroup
                            key={group.title}
                            group={group}
                        />
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        </>
    );
}
