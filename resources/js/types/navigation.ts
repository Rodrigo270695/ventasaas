import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
};

/** Ítem hijo dentro de un grupo desplegable del menú admin */
export type NavSubItem = {
    title: string;
    href?: NonNullable<InertiaLinkProps['href']>;
    /** Módulo aún sin ruta — se muestra deshabilitado */
    soon?: boolean;
};

/** Grupo colapsable alineado a dominios de ESTRUCTURA-BASE-DE-DATOS.md */
export type NavGroup = {
    title: string;
    icon: LucideIcon;
    items: NavSubItem[];
    /** Abrir por defecto si contiene la ruta activa */
    defaultOpen?: boolean;
};
