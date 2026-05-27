import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const adminDashboard: BreadcrumbItem = {
    title: 'Inicio',
    href: dashboard(),
};

export function adminBreadcrumbs(
    section: string,
    sectionHref: string,
    current?: string,
): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [
        adminDashboard,
        { title: section, href: sectionHref },
    ];

    if (current) {
        items.push({ title: current, href: sectionHref });
    }

    return items;
}

export const sistemaRolesIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Roles', href: '/admin/sistema/roles' },
];

export const sistemaRolesCreate = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Roles', href: '/admin/sistema/roles' },
    { title: 'Nuevo', href: '/admin/sistema/roles/create' },
];

export const sistemaRolesEdit = (id: number | string): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Roles', href: '/admin/sistema/roles' },
    { title: 'Editar', href: `/admin/sistema/roles/${id}/edit` },
];

export const sistemaUsersIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Usuarios', href: '/admin/sistema/usuarios' },
];

export const sistemaAuditoriaIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Auditoría', href: '/admin/sistema/auditoria' },
];

export const configuracionTiendaIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Datos de la tienda', href: '/admin/configuracion/tienda' },
];

export const catalogoUnidadesIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Unidades de medida', href: '/admin/catalogo/unidades' },
];

export const catalogoMarcasIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Marcas', href: '/admin/catalogo/marcas' },
];

export const catalogoCategoriasIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Categorías', href: '/admin/catalogo/categorias' },
];

export const catalogoProductosIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Productos', href: '/admin/catalogo/productos' },
];

export const catalogoProductosShow = (
    id: string,
    name: string,
): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Productos', href: '/admin/catalogo/productos' },
    { title: name, href: `/admin/catalogo/productos/${id}` },
];

export const catalogoListasPreciosIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Listas de precios', href: '/admin/catalogo/listas-precios' },
];

export const catalogoPerfilesTributariosIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Perfiles tributarios', href: '/admin/catalogo/perfiles-tributarios' },
];

export const sociosIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Clientes y proveedores', href: '/admin/socios' },
];

export const inventarioAlmacenesIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Almacenes', href: '/admin/inventario/almacenes' },
];

export const inventarioSaldosIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Saldos por almacén', href: '/admin/inventario/saldos' },
];

export const inventarioMovimientosIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Movimientos (kardex)', href: '/admin/inventario/movimientos' },
];

export const documentosSeriesIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Series y numeración', href: '/admin/documentos/series' },
];

export const documentosComprobantesElectronicosIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    {
        title: 'Comprobantes electrónicos',
        href: '/admin/documentos/comprobantes-electronicos',
    },
];

export const ventasComprobantesIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Comprobantes de venta', href: '/admin/ventas/comprobantes' },
];

export const ventasCotizacionesIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Cotizaciones', href: '/admin/ventas/cotizaciones' },
];

export const ventasCotizacionesCreate = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Cotizaciones', href: '/admin/ventas/cotizaciones' },
    { title: 'Nuevo', href: '/admin/ventas/cotizaciones/nuevo' },
];

export const ventasCotizacionesEdit = (id: string): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Cotizaciones', href: '/admin/ventas/cotizaciones' },
    { title: 'Editar', href: `/admin/ventas/cotizaciones/${id}/edit` },
];

export const ventasComprobantesCreate = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Comprobantes de venta', href: '/admin/ventas/comprobantes' },
    { title: 'Nuevo', href: '/admin/ventas/comprobantes/nuevo' },
];

export const ventasComprobantesEdit = (id: string): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Comprobantes de venta', href: '/admin/ventas/comprobantes' },
    { title: 'Editar', href: `/admin/ventas/comprobantes/${id}/edit` },
];

export const ventasTicketsInternosIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Venta rápida', href: '/admin/ventas/tickets-internos' },
];

export const ventasTicketsInternosCreate = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Venta rápida', href: '/admin/ventas/tickets-internos' },
    { title: 'Nuevo', href: '/admin/ventas/tickets-internos/nuevo' },
];

export const ventasTicketsInternosEdit = (id: string): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Venta rápida', href: '/admin/ventas/tickets-internos' },
    { title: 'Editar', href: `/admin/ventas/tickets-internos/${id}/edit` },
];

export const tesoreriaCobrosIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Cobros', href: '/admin/tesoreria/cobros' },
];

export const tesoreriaPagosProveedorIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Pagos a proveedores', href: '/admin/tesoreria/pagos-proveedor' },
];

export const tesoreriaCuentasPorCobrarIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    {
        title: 'Cuentas por cobrar',
        href: '/admin/tesoreria/cuentas-por-cobrar',
    },
];

export const tesoreriaCuentasPorPagarIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    {
        title: 'Cuentas por pagar',
        href: '/admin/tesoreria/cuentas-por-pagar',
    },
];

export const comprasOrdenesIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Órdenes de compra', href: '/admin/compras/ordenes' },
];

export const comprasOrdenForm = (
    id?: string,
    number?: string,
): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Órdenes de compra', href: '/admin/compras/ordenes' },
    id
        ? {
              title: number ?? 'Orden',
              href: `/admin/compras/ordenes/${id}/edit`,
          }
        : { title: 'Nueva orden', href: '/admin/compras/ordenes/nuevo' },
];

export const comprasRecepcionesIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Recepciones', href: '/admin/compras/recepciones' },
];

export const comprasRecepcionForm = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Recepciones', href: '/admin/compras/recepciones' },
    { title: 'Nueva recepción', href: '/admin/compras/recepciones/nuevo' },
];

export const comprasFacturasIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Facturas de compra', href: '/admin/compras/facturas' },
];

export const comprasFacturaForm = (
    id?: string,
    number?: string,
): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Facturas de compra', href: '/admin/compras/facturas' },
    id
        ? {
              title: number ?? 'Factura',
              href: `/admin/compras/facturas/${id}/edit`,
          }
        : { title: 'Nueva factura', href: '/admin/compras/facturas/nuevo' },
];

export const tesoreriaMetodosPagoIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Métodos de pago', href: '/admin/tesoreria/metodos-pago' },
];

export const tesoreriaCajasIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Cajas', href: '/admin/tesoreria/cajas' },
];

export const tesoreriaSesionesIndex = (): BreadcrumbItem[] => [
    adminDashboard,
    { title: 'Sesiones de caja', href: '/admin/tesoreria/sesiones' },
];
