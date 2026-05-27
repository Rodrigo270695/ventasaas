/**
 * Mapa carpetas: resources/js/pages/admin/{modulo}/
 * (sistema → roles/, users/)
 */
import {
    Boxes,
    FileCheck2,
    FileText,
    LayoutGrid,
    Package,
    Settings,
    ShoppingBag,
    ShoppingCart,
    Truck,
    Users,
    Wallet,
    Warehouse,
} from 'lucide-react';
import { dashboard } from '@/routes';
import { edit as profileEdit } from '@/routes/profile';
import { edit as securityEdit } from '@/routes/security';
import type { NavGroup, NavItem } from '@/types';

/** Enlace principal (sin submenú) */
export const adminMainNavItem: NavItem = {
    title: 'Inicio',
    href: dashboard(),
    icon: LayoutGrid,
};

/**
 * Menú ERP por dominio (schema tenant + módulos SUNAT).
 * Rutas `soon` se activarán al implementar cada módulo.
 */
export const adminNavGroups: NavGroup[] = [
    {
        title: 'Catálogo',
        icon: Package,
        items: [
            { title: 'Categorías', href: '/admin/catalogo/categorias' },
            { title: 'Marcas', href: '/admin/catalogo/marcas' },
            { title: 'Productos', href: '/admin/catalogo/productos' },
            { title: 'Listas de precios', href: '/admin/catalogo/listas-precios' },
            { title: 'Perfiles tributarios', href: '/admin/catalogo/perfiles-tributarios' },
            { title: 'Unid. de medida', href: '/admin/catalogo/unidades' },
        ],
    },
    {
        title: 'Socios',
        icon: Users,
        items: [
            { title: 'Clientes y proveedores', href: '/admin/socios' },
            { title: 'Direcciones', soon: true },
        ],
    },
    {
        title: 'Inventario',
        icon: Warehouse,
        items: [
            { title: 'Almacenes', href: '/admin/inventario/almacenes' },
            { title: 'Saldos por almacén', href: '/admin/inventario/saldos' },
            { title: 'Movimientos (kardex)', href: '/admin/inventario/movimientos' },
            { title: 'Reservas de stock', soon: true },
        ],
    },
    {
        title: 'Ventas',
        icon: ShoppingCart,
        items: [
            { title: 'Cotizaciones', href: '/admin/ventas/cotizaciones' },
            { title: 'Pedidos', soon: true },
            { title: 'Comprobantes', href: '/admin/ventas/comprobantes' },
            { title: 'Venta rápida', href: '/admin/ventas/tickets-internos' },
            { title: 'Punto de venta (POS)', soon: true },
        ],
    },
    {
        title: 'Compras',
        icon: ShoppingBag,
        items: [
            { title: 'Órdenes de compra', href: '/admin/compras/ordenes' },
            { title: 'Recepciones', href: '/admin/compras/recepciones' },
            { title: 'Facturas de compra', href: '/admin/compras/facturas' },
        ],
    },
    {
        title: 'Facturación SUNAT',
        icon: FileCheck2,
        items: [
            {
                title: 'Comprobantes electrónicos',
                href: '/admin/documentos/comprobantes-electronicos',
            },
            { title: 'Eventos CPE', soon: true },
            { title: 'Resúmenes diarios', soon: true },
            { title: 'Catálogos SUNAT', soon: true },
        ],
    },
    {
        title: 'Tesorería',
        icon: Wallet,
        items: [
            {
                title: 'Cuentas por cobrar',
                href: '/admin/tesoreria/cuentas-por-cobrar',
            },
            {
                title: 'Cuentas por pagar',
                href: '/admin/tesoreria/cuentas-por-pagar',
            },
            { title: 'Cobros', href: '/admin/tesoreria/cobros' },
            { title: 'Pagos a proveedores', href: '/admin/tesoreria/pagos-proveedor' },
            { title: 'Sesiones de caja', href: '/admin/tesoreria/sesiones' },
            { title: 'Cajas', href: '/admin/tesoreria/cajas' },
            { title: 'Métodos de pago', href: '/admin/tesoreria/metodos-pago' },
        ],
    },
    {
        title: 'Documentos',
        icon: FileText,
        items: [
            { title: 'Series y numeración', href: '/admin/documentos/series' },
            { title: 'Secuencias', soon: true },
        ],
    },
    {
        title: 'SIRE y GRE',
        icon: Truck,
        items: [
            { title: 'Libros SIRE', soon: true },
            { title: 'Guías de remisión', soon: true },
        ],
    },
    {
        title: 'Configuración',
        icon: Settings,
        items: [
            { title: 'Datos de la tienda', href: '/admin/configuracion/tienda' },
            { title: 'Sucursales', soon: true },
            { title: 'Tipos de cambio', soon: true },
            { title: 'Mi perfil', href: profileEdit() },
            { title: 'Seguridad', href: securityEdit() },
        ],
    },
    {
        title: 'Sistema',
        icon: Boxes,
        items: [
            { title: 'Usuarios', href: '/admin/sistema/usuarios' },
            { title: 'Roles', href: '/admin/sistema/roles' },
            { title: 'Auditoría', href: '/admin/sistema/auditoria' },
        ],
    },
];
