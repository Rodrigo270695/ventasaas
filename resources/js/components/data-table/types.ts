import type { ReactNode } from 'react';

export type DataTableColumn<T> = {
    id: string;
    header: string;
    cell: (row: T) => ReactNode;
    /** Etiqueta en el detalle expandible móvil. Si no se define, se usa `header`. */
    mobileLabel?: string;
    /** Ocultar en móvil (solo escritorio) */
    hideOnMobile?: boolean;
    /** Columna principal en la tarjeta móvil */
    primary?: boolean;
    /** Permite ordenar ASC/DESC desde el encabezado */
    sortable?: boolean;
    /** Valor usado al ordenar (debe ser estable, no JSX) */
    sortValue?: (row: T) => string | number;
    headerClassName?: string;
    cellClassName?: string;
    /** Trunca texto largo con ellipsis (recomendado en columnas de texto). */
    truncate?: boolean;
};
