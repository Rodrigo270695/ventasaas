import {
    AUDIT_PERMISSIONS,
    BRANDS_PERMISSIONS,
    CATEGORIES_PERMISSIONS,
    DOCUMENT_SERIES_PERMISSIONS,
    ELECTRONIC_DOCUMENTS_PERMISSIONS,
    PARTIES_PERMISSIONS,
    PRICE_LISTS_PERMISSIONS,
    PRODUCTS_PERMISSIONS,
    PURCHASES_PERMISSIONS,
    SALES_INTERNAL_PERMISSIONS,
    SALES_QUOTATIONS_PERMISSIONS,
    SALES_PERMISSIONS,
    SETTINGS_PERMISSIONS,
    STORE_COVERS_PERMISSIONS,
    STOCK_BALANCES_PERMISSIONS,
    STOCK_MOVEMENTS_PERMISSIONS,
    TAX_PROFILES_PERMISSIONS,
    TREASURY_CASH_REGISTERS_PERMISSIONS,
    TREASURY_CASH_SESSIONS_PERMISSIONS,
    TREASURY_COLLECTIONS_PERMISSIONS,
    TREASURY_DISBURSEMENTS_PERMISSIONS,
    TREASURY_PAYMENT_METHODS_PERMISSIONS,
    UNITS_PERMISSIONS,
    USERS_PERMISSIONS,
    ROLES_PERMISSIONS,
    WAREHOUSES_PERMISSIONS,
} from '@/lib/admin-permissions';
import type { NavGroup } from '@/types';

type NavPermissionRule = string | readonly string[];

/** Permiso(s) requeridos por ruta del menú admin (alineado a config/permissions.php). */
export const NAV_ITEM_PERMISSIONS: Record<string, NavPermissionRule> = {
    '/admin/catalogo/categorias': CATEGORIES_PERMISSIONS.VIEW,
    '/admin/catalogo/marcas': BRANDS_PERMISSIONS.VIEW,
    '/admin/catalogo/productos': PRODUCTS_PERMISSIONS.VIEW,
    '/admin/catalogo/listas-precios': PRICE_LISTS_PERMISSIONS.VIEW,
    '/admin/catalogo/perfiles-tributarios': TAX_PROFILES_PERMISSIONS.VIEW,
    '/admin/catalogo/unidades': UNITS_PERMISSIONS.VIEW,
    '/admin/socios': PARTIES_PERMISSIONS.VIEW,
    '/admin/inventario/almacenes': WAREHOUSES_PERMISSIONS.VIEW,
    '/admin/inventario/saldos': STOCK_BALANCES_PERMISSIONS.VIEW,
    '/admin/inventario/movimientos': STOCK_MOVEMENTS_PERMISSIONS.VIEW,
    '/admin/ventas/comprobantes': SALES_PERMISSIONS.VIEW,
    '/admin/ventas/cotizaciones': SALES_QUOTATIONS_PERMISSIONS.VIEW,
    '/admin/ventas/tickets-internos': SALES_INTERNAL_PERMISSIONS.VIEW,
    '/admin/compras/ordenes': PURCHASES_PERMISSIONS.VIEW,
    '/admin/compras/recepciones': PURCHASES_PERMISSIONS.VIEW,
    '/admin/compras/facturas': PURCHASES_PERMISSIONS.VIEW,
    '/admin/documentos/comprobantes-electronicos':
        ELECTRONIC_DOCUMENTS_PERMISSIONS.VIEW,
    '/admin/tesoreria/cuentas-por-cobrar': TREASURY_COLLECTIONS_PERMISSIONS.VIEW,
    '/admin/tesoreria/cuentas-por-pagar': [
        TREASURY_DISBURSEMENTS_PERMISSIONS.VIEW,
        TREASURY_COLLECTIONS_PERMISSIONS.VIEW,
    ],
    '/admin/tesoreria/cobros': TREASURY_COLLECTIONS_PERMISSIONS.VIEW,
    '/admin/tesoreria/pagos-proveedor': [
        TREASURY_DISBURSEMENTS_PERMISSIONS.VIEW,
        TREASURY_COLLECTIONS_PERMISSIONS.VIEW,
    ],
    '/admin/tesoreria/sesiones': TREASURY_CASH_SESSIONS_PERMISSIONS.VIEW,
    '/admin/tesoreria/cajas': TREASURY_CASH_REGISTERS_PERMISSIONS.VIEW,
    '/admin/tesoreria/metodos-pago': TREASURY_PAYMENT_METHODS_PERMISSIONS.VIEW,
    '/admin/documentos/series': DOCUMENT_SERIES_PERMISSIONS.VIEW,
    '/admin/configuracion/tienda': SETTINGS_PERMISSIONS.VIEW,
    '/admin/configuracion/portada': STORE_COVERS_PERMISSIONS.VIEW,
    '/admin/sistema/usuarios': USERS_PERMISSIONS.VIEW,
    '/admin/sistema/roles': ROLES_PERMISSIONS.VIEW,
    '/admin/sistema/auditoria': AUDIT_PERMISSIONS.VIEW,
};

export function canAccessNavHref(
    href: string,
    can: (permission: string) => boolean,
    canAny: (...permissions: string[]) => boolean,
): boolean {
    const rule = NAV_ITEM_PERMISSIONS[href];

    if (!rule) {
        return true;
    }

    if (typeof rule === 'string') {
        return can(rule);
    }

    return canAny(...rule);
}

export function filterNavGroups(
    groups: NavGroup[],
    can: (permission: string) => boolean,
    canAny: (...permissions: string[]) => boolean,
): NavGroup[] {
    return groups
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) =>
                    !!item.href &&
                    !item.soon &&
                    canAccessNavHref(item.href, can, canAny),
            ),
        }))
        .filter((group) => group.items.length > 0);
}
