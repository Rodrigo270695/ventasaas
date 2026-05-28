/** Permisos del módulo de roles (guard web). */
export const ROLES_PERMISSIONS = {
    VIEW: 'roles.view',
    CREATE: 'roles.create',
    UPDATE: 'roles.update',
    DELETE: 'roles.delete',
    ASSIGN_PERMISSIONS: 'roles.assign-permissions',
} as const;

/** Permisos del módulo de auditoría del sistema. */
export const AUDIT_PERMISSIONS = {
    VIEW: 'audit.view',
} as const;

/** Permisos del módulo de usuarios (guard web). */
export const USERS_PERMISSIONS = {
    VIEW: 'users.view',
    CREATE: 'users.create',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
    ASSIGN_ROLES: 'users.assign-roles',
} as const;

/** Permisos del catálogo (productos, categorías, …). */
export const CATALOG_PERMISSIONS = {
    VIEW: 'catalog.view',
    MANAGE: 'catalog.manage',
} as const;

/** Permisos del módulo de unidades de medida. */
export const UNITS_PERMISSIONS = {
    VIEW: 'units.view',
    CREATE: 'units.create',
    UPDATE: 'units.update',
    DELETE: 'units.delete',
} as const;

/** Permisos del módulo de marcas. */
export const BRANDS_PERMISSIONS = {
    VIEW: 'brands.view',
    CREATE: 'brands.create',
    UPDATE: 'brands.update',
    DELETE: 'brands.delete',
} as const;

/** Permisos del módulo de categorías. */
export const CATEGORIES_PERMISSIONS = {
    VIEW: 'categories.view',
    CREATE: 'categories.create',
    UPDATE: 'categories.update',
    DELETE: 'categories.delete',
} as const;

/** Permisos del módulo de perfiles tributarios. */
export const TAX_PROFILES_PERMISSIONS = {
    VIEW: 'tax_profiles.view',
    CREATE: 'tax_profiles.create',
    UPDATE: 'tax_profiles.update',
    DELETE: 'tax_profiles.delete',
} as const;

/** Permisos del módulo de listas de precios. */
export const PRICE_LISTS_PERMISSIONS = {
    VIEW: 'price_lists.view',
    CREATE: 'price_lists.create',
    UPDATE: 'price_lists.update',
    DELETE: 'price_lists.delete',
} as const;

/** Permisos del módulo de productos. */
export const PRODUCTS_PERMISSIONS = {
    VIEW: 'products.view',
    CREATE: 'products.create',
    UPDATE: 'products.update',
    DELETE: 'products.delete',
} as const;

/** Permisos de configuración / datos de tienda. */
export const SETTINGS_PERMISSIONS = {
    VIEW: 'settings.view',
    MANAGE: 'settings.manage',
} as const;

/** Permisos de fotos de portada del catálogo público. */
export const STORE_COVERS_PERMISSIONS = {
    VIEW: 'store_covers.view',
    CREATE: 'store_covers.create',
    UPDATE: 'store_covers.update',
    DELETE: 'store_covers.delete',
} as const;

/** Permisos del módulo de socios (clientes y proveedores). */
export const PARTIES_PERMISSIONS = {
    VIEW: 'parties.view',
    CREATE: 'parties.create',
    UPDATE: 'parties.update',
    DELETE: 'parties.delete',
} as const;

/** Permisos del módulo de almacenes. */
export const WAREHOUSES_PERMISSIONS = {
    VIEW: 'warehouses.view',
    CREATE: 'warehouses.create',
    UPDATE: 'warehouses.update',
    DELETE: 'warehouses.delete',
} as const;

/** Permisos de saldos y ajustes de stock. */
export const STOCK_BALANCES_PERMISSIONS = {
    VIEW: 'stock_balances.view',
    ADJUST: 'stock_balances.adjust',
} as const;

/** Permisos de kardex / movimientos de inventario. */
export const STOCK_MOVEMENTS_PERMISSIONS = {
    VIEW: 'stock_movements.view',
    EXPORT: 'stock_movements.export',
} as const;

/** Permisos de series y numeración SUNAT. */
export const DOCUMENT_SERIES_PERMISSIONS = {
    VIEW: 'document_series.view',
    CREATE: 'document_series.create',
    UPDATE: 'document_series.update',
    DELETE: 'document_series.delete',
} as const;

/** Permisos de comprobantes electrónicos (CPE SUNAT). */
export const ELECTRONIC_DOCUMENTS_PERMISSIONS = {
    VIEW: 'electronic_documents.view',
    MANAGE: 'electronic_documents.manage',
} as const;

/** Permisos de comprobantes de venta. */
export const SALES_PERMISSIONS = {
    VIEW: 'sales.view',
    CREATE: 'sales.create',
    UPDATE: 'sales.update',
    DELETE: 'sales.delete',
    CONFIRM: 'sales.confirm',
} as const;

/** Tickets internos (venta rápida, sin CPE). */
export const SALES_INTERNAL_PERMISSIONS = {
    VIEW: 'sales.internal.view',
    CREATE: 'sales.internal.create',
    UPDATE: 'sales.internal.update',
    DELETE: 'sales.internal.delete',
    CONFIRM: 'sales.internal.confirm',
} as const;

/** Cotizaciones comerciales (sin impacto en inventario). */
export const SALES_QUOTATIONS_PERMISSIONS = {
    VIEW: 'sales.quotations.view',
    CREATE: 'sales.quotations.create',
    UPDATE: 'sales.quotations.update',
    SEND_EMAIL: 'sales.quotations.send-email',
} as const;

/** Compras (facturas de proveedor). */
export const PURCHASES_PERMISSIONS = {
    VIEW: 'purchases.view',
    MANAGE: 'purchases.manage',
} as const;

/** Métodos de pago (tesorería). */
export const TREASURY_PAYMENT_METHODS_PERMISSIONS = {
    VIEW: 'treasury.payment_methods.view',
    CREATE: 'treasury.payment_methods.create',
    UPDATE: 'treasury.payment_methods.update',
    DELETE: 'treasury.payment_methods.delete',
} as const;

/** Cobros a clientes (tesorería). */
export const TREASURY_COLLECTIONS_PERMISSIONS = {
    VIEW: 'treasury.collections.view',
    CREATE: 'treasury.collections.create',
    UPDATE: 'treasury.collections.update',
} as const;

/** Pagos a proveedores y cuentas por pagar. */
export const TREASURY_DISBURSEMENTS_PERMISSIONS = {
    VIEW: 'treasury.disbursements.view',
    CREATE: 'treasury.disbursements.create',
    UPDATE: 'treasury.disbursements.update',
} as const;

type CanFn = (permission: string) => boolean;

/** Compatibilidad mientras roles migran de collections.* a disbursements.* */
export function canViewDisbursements(can: CanFn): boolean {
    return (
        can(TREASURY_DISBURSEMENTS_PERMISSIONS.VIEW) ||
        can(TREASURY_COLLECTIONS_PERMISSIONS.VIEW)
    );
}

export function canCreateDisbursements(can: CanFn): boolean {
    return (
        can(TREASURY_DISBURSEMENTS_PERMISSIONS.CREATE) ||
        can(TREASURY_COLLECTIONS_PERMISSIONS.CREATE)
    );
}

export function canUpdateDisbursements(can: CanFn): boolean {
    return (
        can(TREASURY_DISBURSEMENTS_PERMISSIONS.UPDATE) ||
        can(TREASURY_COLLECTIONS_PERMISSIONS.CREATE)
    );
}

/** Cajas registradoras (tesorería). */
export const TREASURY_CASH_REGISTERS_PERMISSIONS = {
    VIEW: 'treasury.cash_registers.view',
    CREATE: 'treasury.cash_registers.create',
    UPDATE: 'treasury.cash_registers.update',
    DELETE: 'treasury.cash_registers.delete',
} as const;

/** Sesiones de caja (tesorería). */
export const TREASURY_CASH_SESSIONS_PERMISSIONS = {
    VIEW: 'treasury.cash_sessions.view',
    OPEN: 'treasury.cash_sessions.open',
    CLOSE: 'treasury.cash_sessions.close',
} as const;
