import type { Popover } from 'driver.js';
import {
    BRANDS_PERMISSIONS,
    CATEGORIES_PERMISSIONS,
    DOCUMENT_SERIES_PERMISSIONS,
    ELECTRONIC_DOCUMENTS_PERMISSIONS,
    PARTIES_PERMISSIONS,
    PRICE_LISTS_PERMISSIONS,
    PRODUCTS_PERMISSIONS,
    PURCHASES_PERMISSIONS,
    ROLES_PERMISSIONS,
    SALES_PERMISSIONS,
    SALES_QUOTATIONS_PERMISSIONS,
    TAX_PROFILES_PERMISSIONS,
    TREASURY_COLLECTIONS_PERMISSIONS,
    TREASURY_DISBURSEMENTS_PERMISSIONS,
    UNITS_PERMISSIONS,
    USERS_PERMISSIONS,
    WAREHOUSES_PERMISSIONS,
} from '@/lib/admin-permissions';

export type PageTourStepDef = {
    element?: string;
    popover: Popover;
    permission?: string | string[];
    requireAllPermissions?: boolean;
    skipIfMissing?: boolean;
};

export type PageTourDefinition = {
    id: string;
    path: string;
    steps: PageTourStepDef[];
};

type CrudTourConfig = {
    id: string;
    path: string;
    title: string;
    description: string;
    entityName: string;
    entityNamePlural: string;
    newLabel: string;
    createPermission?: string;
    updatePermission?: string;
    deletePermission?: string;
    searchHint?: string;
    tableHint?: string;
};

function welcomeStep(title: string, description: string): PageTourStepDef {
    return {
        popover: {
            title,
            description: `${description} Esta guía de pantalla solo se muestra automáticamente la primera vez que entras aquí.`,
            side: 'over',
            align: 'center',
            showButtons: ['next', 'close'],
        },
    };
}

/** Tour estándar para pantallas índice con PageHeader + DataTable. */
export function createCrudIndexTour(config: CrudTourConfig): PageTourDefinition {
    const steps: PageTourStepDef[] = [
        welcomeStep(config.title, config.description),
        {
            element: '[data-tour="page-header"]',
            popover: {
                title: config.title,
                description: config.description,
                side: 'bottom',
                align: 'start',
            },
        },
    ];

    if (config.createPermission) {
        steps.push({
            element: '[data-tour="page-new"]',
            permission: config.createPermission,
            popover: {
                title: config.newLabel,
                description: `Registra un nuevo elemento en ${config.entityNamePlural.toLowerCase()}. Se abrirá un formulario para completar los datos.`,
                side: 'left',
                align: 'start',
            },
        });
    }

    steps.push(
        {
            element: '[data-tour="page-stats"]',
            skipIfMissing: true,
            popover: {
                title: 'Indicadores',
                description:
                    'Resumen rápido: totales, activos/inactivos u otras métricas según el módulo.',
                side: 'bottom',
                align: 'start',
            },
        },
        {
            element: '[data-tour="page-search"]',
            skipIfMissing: true,
            popover: {
                title: 'Buscador',
                description:
                    config.searchHint ??
                    `Filtra ${config.entityNamePlural.toLowerCase()} por nombre, código u otros campos visibles.`,
                side: 'bottom',
                align: 'start',
            },
        },
        {
            element: '[data-tour="page-table"]',
            popover: {
                title: 'Listado',
                description:
                    config.tableHint ??
                    `Aquí ves todos los registros. Haz clic en una fila o usa las acciones según tu permiso.`,
                side: 'top',
                align: 'start',
            },
        },
    );

    const actionPermissions = [config.updatePermission, config.deletePermission].filter(
        Boolean,
    ) as string[];

    if (actionPermissions.length > 0) {
        steps.push({
            element: '[data-tour="page-actions"]',
            permission: actionPermissions,
            skipIfMissing: true,
            popover: {
                title: 'Acciones por fila',
                description: [
                    config.updatePermission
                        ? 'Editar: modifica los datos del registro.'
                        : null,
                    config.deletePermission
                        ? 'Eliminar: quita el registro cuando las reglas del negocio lo permitan.'
                        : null,
                ]
                    .filter(Boolean)
                    .join(' '),
                side: 'left',
                align: 'end',
            },
        });
    }

    return {
        id: config.id,
        path: config.path,
        steps,
    };
}

export const adminPageTours: PageTourDefinition[] = [
    createCrudIndexTour({
        id: 'catalogo.categorias',
        path: '/admin/catalogo/categorias',
        title: 'Categorías',
        description:
            'Organiza el catálogo en jerarquía (categorías padre e hijas).',
        entityName: 'categoría',
        entityNamePlural: 'Categorías',
        newLabel: 'Nueva categoría',
        createPermission: CATEGORIES_PERMISSIONS.CREATE,
        updatePermission: CATEGORIES_PERMISSIONS.UPDATE,
        deletePermission: CATEGORIES_PERMISSIONS.DELETE,
        tableHint:
            'Las subcategorías se muestran indentadas. Solo puedes eliminar una categoría sin hijos.',
    }),
    createCrudIndexTour({
        id: 'catalogo.marcas',
        path: '/admin/catalogo/marcas',
        title: 'Marcas',
        description: 'Clasifica productos por marca comercial.',
        entityName: 'marca',
        entityNamePlural: 'Marcas',
        newLabel: 'Nueva marca',
        createPermission: BRANDS_PERMISSIONS.CREATE,
        updatePermission: BRANDS_PERMISSIONS.UPDATE,
        deletePermission: BRANDS_PERMISSIONS.DELETE,
    }),
    createCrudIndexTour({
        id: 'catalogo.productos',
        path: '/admin/catalogo/productos',
        title: 'Productos',
        description:
            'Catálogo de bienes y servicios para ventas, compras e inventario.',
        entityName: 'producto',
        entityNamePlural: 'Productos',
        newLabel: 'Nuevo producto',
        createPermission: PRODUCTS_PERMISSIONS.CREATE,
        updatePermission: PRODUCTS_PERMISSIONS.UPDATE,
        deletePermission: PRODUCTS_PERMISSIONS.DELETE,
        tableHint:
            'Abre el detalle del producto desde la fila. Gestiona variantes y precios en la ficha.',
    }),
    createCrudIndexTour({
        id: 'catalogo.unidades',
        path: '/admin/catalogo/unidades',
        title: 'Unidades de medida',
        description: 'Define unidades para cantidades en productos y documentos.',
        entityName: 'unidad',
        entityNamePlural: 'Unidades',
        newLabel: 'Nueva unidad',
        createPermission: UNITS_PERMISSIONS.CREATE,
        updatePermission: UNITS_PERMISSIONS.UPDATE,
        deletePermission: UNITS_PERMISSIONS.DELETE,
    }),
    createCrudIndexTour({
        id: 'catalogo.listas-precios',
        path: '/admin/catalogo/listas-precios',
        title: 'Listas de precios',
        description: 'Precios de venta por lista o segmento de clientes.',
        entityName: 'lista',
        entityNamePlural: 'Listas de precios',
        newLabel: 'Nueva lista',
        createPermission: PRICE_LISTS_PERMISSIONS.CREATE,
        updatePermission: PRICE_LISTS_PERMISSIONS.UPDATE,
        deletePermission: PRICE_LISTS_PERMISSIONS.DELETE,
    }),
    createCrudIndexTour({
        id: 'catalogo.perfiles-tributarios',
        path: '/admin/catalogo/perfiles-tributarios',
        title: 'Perfiles tributarios',
        description: 'Configura IGV y tratamiento fiscal de productos.',
        entityName: 'perfil',
        entityNamePlural: 'Perfiles tributarios',
        newLabel: 'Nuevo perfil',
        createPermission: TAX_PROFILES_PERMISSIONS.CREATE,
        updatePermission: TAX_PROFILES_PERMISSIONS.UPDATE,
        deletePermission: TAX_PROFILES_PERMISSIONS.DELETE,
    }),
    createCrudIndexTour({
        id: 'socios',
        path: '/admin/socios',
        title: 'Clientes y proveedores',
        description: 'Directorio de socios de negocio para ventas y compras.',
        entityName: 'socio',
        entityNamePlural: 'Socios',
        newLabel: 'Nuevo socio',
        createPermission: PARTIES_PERMISSIONS.CREATE,
        updatePermission: PARTIES_PERMISSIONS.UPDATE,
        deletePermission: PARTIES_PERMISSIONS.DELETE,
    }),
    createCrudIndexTour({
        id: 'inventario.almacenes',
        path: '/admin/inventario/almacenes',
        title: 'Almacenes',
        description: 'Ubicaciones físicas donde se guarda el stock.',
        entityName: 'almacén',
        entityNamePlural: 'Almacenes',
        newLabel: 'Nuevo almacén',
        createPermission: WAREHOUSES_PERMISSIONS.CREATE,
        updatePermission: WAREHOUSES_PERMISSIONS.UPDATE,
        deletePermission: WAREHOUSES_PERMISSIONS.DELETE,
    }),
    createCrudIndexTour({
        id: 'inventario.saldos',
        path: '/admin/inventario/saldos',
        title: 'Saldos por almacén',
        description: 'Consulta existencias actuales y alertas de stock mínimo.',
        entityName: 'saldo',
        entityNamePlural: 'Saldos',
        newLabel: 'Ajustar stock',
        searchHint: 'Filtra por producto, SKU o almacén.',
        tableHint:
            'Las filas en color indican stock bajo o crítico respecto al mínimo configurado.',
    }),
    createCrudIndexTour({
        id: 'inventario.movimientos',
        path: '/admin/inventario/movimientos',
        title: 'Movimientos (kardex)',
        description: 'Historial de entradas y salidas de inventario.',
        entityName: 'movimiento',
        entityNamePlural: 'Movimientos',
        newLabel: 'Nuevo movimiento',
        searchHint: 'Filtra por producto, almacén o tipo de movimiento.',
    }),
    createCrudIndexTour({
        id: 'ventas.cotizaciones',
        path: '/admin/ventas/cotizaciones',
        title: 'Cotizaciones',
        description: 'Propuestas comerciales antes de facturar.',
        entityName: 'cotización',
        entityNamePlural: 'Cotizaciones',
        newLabel: 'Nueva cotización',
        createPermission: SALES_QUOTATIONS_PERMISSIONS.CREATE,
        updatePermission: SALES_QUOTATIONS_PERMISSIONS.UPDATE,
    }),
    createCrudIndexTour({
        id: 'ventas.comprobantes',
        path: '/admin/ventas/comprobantes',
        title: 'Comprobantes de venta',
        description: 'Facturas, boletas y notas emitidas a clientes.',
        entityName: 'comprobante',
        entityNamePlural: 'Comprobantes',
        newLabel: 'Nuevo comprobante',
        createPermission: SALES_PERMISSIONS.CREATE,
        updatePermission: SALES_PERMISSIONS.UPDATE,
        deletePermission: SALES_PERMISSIONS.DELETE,
    }),
    createCrudIndexTour({
        id: 'compras.facturas',
        path: '/admin/compras/facturas',
        title: 'Facturas de compra',
        description: 'Registro de compras a proveedores.',
        entityName: 'factura',
        entityNamePlural: 'Facturas de compra',
        newLabel: 'Nueva factura',
        createPermission: PURCHASES_PERMISSIONS.MANAGE,
        updatePermission: PURCHASES_PERMISSIONS.MANAGE,
        deletePermission: PURCHASES_PERMISSIONS.MANAGE,
    }),
    createCrudIndexTour({
        id: 'documentos.series',
        path: '/admin/documentos/series',
        title: 'Series y numeración',
        description: 'Series SUNAT y correlativos por tipo de comprobante.',
        entityName: 'serie',
        entityNamePlural: 'Series',
        newLabel: 'Nueva serie',
        createPermission: DOCUMENT_SERIES_PERMISSIONS.CREATE,
        updatePermission: DOCUMENT_SERIES_PERMISSIONS.UPDATE,
        deletePermission: DOCUMENT_SERIES_PERMISSIONS.DELETE,
    }),
    createCrudIndexTour({
        id: 'documentos.cpe',
        path: '/admin/documentos/comprobantes-electronicos',
        title: 'Comprobantes electrónicos',
        description: 'Envío y estado de CPE ante SUNAT.',
        entityName: 'CPE',
        entityNamePlural: 'Comprobantes electrónicos',
        newLabel: 'Gestionar CPE',
        createPermission: ELECTRONIC_DOCUMENTS_PERMISSIONS.MANAGE,
        updatePermission: ELECTRONIC_DOCUMENTS_PERMISSIONS.MANAGE,
    }),
    createCrudIndexTour({
        id: 'tesoreria.cxc',
        path: '/admin/tesoreria/cuentas-por-cobrar',
        title: 'Cuentas por cobrar',
        description: 'Deudas de clientes pendientes de cobro.',
        entityName: 'cuenta',
        entityNamePlural: 'Cuentas por cobrar',
        newLabel: 'Registrar cobro',
        createPermission: TREASURY_COLLECTIONS_PERMISSIONS.CREATE,
    }),
    createCrudIndexTour({
        id: 'tesoreria.cxp',
        path: '/admin/tesoreria/cuentas-por-pagar',
        title: 'Cuentas por pagar',
        description: 'Obligaciones con proveedores.',
        entityName: 'cuenta',
        entityNamePlural: 'Cuentas por pagar',
        newLabel: 'Registrar pago',
        createPermission: TREASURY_DISBURSEMENTS_PERMISSIONS.CREATE,
    }),
    createCrudIndexTour({
        id: 'sistema.usuarios',
        path: '/admin/sistema/usuarios',
        title: 'Usuarios',
        description: 'Cuentas de acceso al panel administrativo.',
        entityName: 'usuario',
        entityNamePlural: 'Usuarios',
        newLabel: 'Nuevo usuario',
        createPermission: USERS_PERMISSIONS.CREATE,
        updatePermission: USERS_PERMISSIONS.UPDATE,
        deletePermission: USERS_PERMISSIONS.DELETE,
    }),
    createCrudIndexTour({
        id: 'sistema.roles',
        path: '/admin/sistema/roles',
        title: 'Roles',
        description: 'Perfiles de permisos asignables a usuarios.',
        entityName: 'rol',
        entityNamePlural: 'Roles',
        newLabel: 'Nuevo rol',
        createPermission: ROLES_PERMISSIONS.CREATE,
        updatePermission: ROLES_PERMISSIONS.UPDATE,
        deletePermission: ROLES_PERMISSIONS.DELETE,
        tableHint:
            'Desde cada rol puedes abrir permisos y definir qué módulos ve el usuario.',
    }),
    createCrudIndexTour({
        id: 'sistema.auditoria',
        path: '/admin/sistema/auditoria',
        title: 'Auditoría',
        description: 'Registro de acciones en el sistema.',
        entityName: 'evento',
        entityNamePlural: 'Eventos',
        searchHint: 'Filtra por usuario, módulo, acción o fecha.',
        tableHint: 'Revisa quién hizo cada cambio y cuándo.',
    }),
    {
        id: 'dashboard',
        path: '/dashboard',
        steps: [
            welcomeStep(
                'Panel de inicio',
                'Resumen de ventas, inventario y accesos rápidos.',
            ),
            {
                element: '[data-tour="dashboard-filters"]',
                skipIfMissing: true,
                popover: {
                    title: 'Filtros',
                    description:
                        'Elige el periodo (7, 30 o 90 días) y el almacén para los gráficos.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="dashboard-kpis"]',
                skipIfMissing: true,
                popover: {
                    title: 'Indicadores del día',
                    description:
                        'Ventas de hoy, pedidos, clientes y productos activos.',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="dashboard-charts"]',
                skipIfMissing: true,
                popover: {
                    title: 'Gráficos',
                    description:
                        'Tendencia de ventas, categorías, top productos y alertas de stock.',
                    side: 'top',
                    align: 'start',
                },
            },
        ],
    },
];

export function normalizePagePath(url?: string | null): string {
    if (!url) {
        return '/';
    }

    const path = url.split('?')[0].replace(/\/$/, '');

    return path || '/';
}

export function findPageTourByPath(url?: string | null): PageTourDefinition | undefined {
    const path = normalizePagePath(url);

    return adminPageTours.find((tour) => tour.path === path);
}
