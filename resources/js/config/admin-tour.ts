import type { NavGroup } from '@/types';

export function navGroupTourId(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export function navGroupTourSelector(title: string): string {
    return `[data-tour="nav-group-${navGroupTourId(title)}"]`;
}

/** Texto breve por módulo del menú lateral. */
export const adminNavGroupTourDescriptions: Record<string, string> = {
    Catálogo:
        'Administra productos, categorías, marcas, listas de precios y unidades de medida.',
    Socios: 'Gestiona clientes, proveedores y sus datos comerciales.',
    Inventario:
        'Controla almacenes, saldos, movimientos de stock (kardex) y alertas de mínimo.',
    Ventas:
        'Emite cotizaciones, comprobantes de venta, tickets internos y venta rápida.',
    Compras:
        'Registra órdenes de compra, recepciones de mercadería y facturas de proveedor.',
    'Facturación SUNAT':
        'Envía y consulta comprobantes electrónicos (CPE) ante SUNAT.',
    Tesorería:
        'Cuentas por cobrar y pagar, cobros, pagos, cajas y métodos de pago.',
    Documentos: 'Configura series y numeración de comprobantes.',
    'SIRE y GRE': 'Libros electrónicos SIRE y guías de remisión (próximamente).',
    Configuración:
        'Datos de la tienda, perfil, seguridad y apariencia del panel.',
    Sistema: 'Usuarios, roles, permisos y auditoría de acciones.',
};

export function buildNavGroupTourStep(group: NavGroup): {
    element: string;
    popover: {
        title: string;
        description: string;
        side: 'right';
        align: 'start';
    };
} {
    const description =
        adminNavGroupTourDescriptions[group.title] ??
        `Accede a las pantallas de ${group.title.toLowerCase()}.`;

    return {
        element: navGroupTourSelector(group.title),
        popover: {
            title: group.title,
            description: `${description} Haz clic en el módulo para desplegar sus opciones.`,
            side: 'right',
            align: 'start',
        },
    };
}
