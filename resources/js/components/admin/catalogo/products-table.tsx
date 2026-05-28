import { Link } from '@inertiajs/react';
import { ExternalLink, Package, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { PRODUCT_TYPE_LABELS } from '@/lib/product-stat-icons';
import { show as productShow } from '@/routes/admin/catalogo/productos';
import { cn } from '@/lib/utils';
import type { ProductRow } from '@/types/admin/products';

export type ProductTableAbilities = {
    canUpdate: boolean;
    canDelete: boolean;
    canViewStock: boolean;
};

type Props = {
    products: ProductRow[];
    abilities: ProductTableAbilities;
    onOpen: (product: ProductRow) => void;
    onDelete: (product: ProductRow) => void;
    onViewStock?: (product: ProductRow) => void;
    onFilteredCountChange?: (count: number) => void;
};

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                active
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
                    : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
            )}
        >
            {active ? 'Activo' : 'Inactivo'}
        </span>
    );
}

function TypeBadge({ type }: { type: ProductRow['type'] }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                type === 'service'
                    ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/80'
                    : 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200/80',
            )}
        >
            {PRODUCT_TYPE_LABELS[type]}
        </span>
    );
}

export function ProductsTable({
    products,
    abilities,
    onOpen,
    onDelete,
    onViewStock,
    onFilteredCountChange,
}: Props) {
    const hasActions = true;

    const columns = useMemo<DataTableColumn<ProductRow>[]>(
        () => [
            {
                id: 'name',
                header: 'Producto',
                primary: true,
                sortable: true,
                sortValue: (row) => row.name,
                truncate: true,
                cell: (row) => (
                    <Link
                        href={productShow.url(row.id)}
                        className="font-semibold text-[#3b2d4a] underline-offset-2 hover:text-[#6d28d9] hover:underline"
                    >
                        {row.name}
                    </Link>
                ),
            },
            {
                id: 'default_sku',
                header: 'SKU principal',
                mobileLabel: 'SKU',
                sortable: true,
                sortValue: (row) => row.default_sku ?? '',
                cell: (row) => row.default_sku ?? '—',
                cellClassName: 'font-mono text-sm text-[#7c6f8a]',
            },
            {
                id: 'default_price',
                header: 'Precio',
                mobileLabel: 'Precio',
                sortable: true,
                sortValue: (row) => Number(row.default_price ?? 0),
                hideOnMobile: true,
                cell: (row) =>
                    row.default_price ? (
                        <span className="font-mono text-sm tabular-nums text-[#4c1d95]">
                            S/ {row.default_price}
                        </span>
                    ) : (
                        '—'
                    ),
            },
            {
                id: 'default_tax',
                header: 'Tributación',
                mobileLabel: 'IGV',
                sortable: true,
                sortValue: (row) => row.default_tax_label ?? '',
                hideOnMobile: true,
                cell: (row) => row.default_tax_label ?? '—',
                cellClassName: 'text-xs text-[#6b5b7a]',
            },
            {
                id: 'variants_count',
                header: 'Variantes',
                mobileLabel: 'Variantes',
                sortable: true,
                sortValue: (row) => row.variants_count,
                hideOnMobile: true,
                cell: (row) => (
                    <span className="tabular-nums text-[#6b5b7a]">
                        {row.variants_count}
                    </span>
                ),
            },
            {
                id: 'category',
                header: 'Categoría',
                mobileLabel: 'Categoría',
                sortable: true,
                sortValue: (row) => row.category_name ?? '',
                truncate: true,
                cell: (row) => row.category_name ?? '—',
                cellClassName: 'text-[#6b5b7a]',
            },
            {
                id: 'brand',
                header: 'Marca',
                mobileLabel: 'Marca',
                sortable: true,
                sortValue: (row) => row.brand_name ?? '',
                truncate: true,
                hideOnMobile: true,
                cell: (row) => row.brand_name ?? '—',
                cellClassName: 'text-[#6b5b7a]',
            },
            {
                id: 'unit',
                header: 'Unidad',
                mobileLabel: 'Unidad',
                sortable: true,
                sortValue: (row) => row.base_unit_label ?? '',
                truncate: true,
                hideOnMobile: true,
                cell: (row) => row.base_unit_label ?? '—',
                cellClassName: 'text-[#6b5b7a]',
            },
            {
                id: 'type',
                header: 'Tipo',
                mobileLabel: 'Tipo',
                sortable: true,
                sortValue: (row) => row.type,
                cell: (row) => <TypeBadge type={row.type} />,
            },
            {
                id: 'status',
                header: 'Estado',
                mobileLabel: 'Estado',
                sortable: true,
                sortValue: (row) => (row.is_active ? 1 : 0),
                cell: (row) => <StatusBadge active={row.is_active} />,
            },
        ],
        [],
    );

    const getSearchText = useCallback(
        (row: ProductRow) =>
            [
                row.name,
                row.default_sku,
                String(row.variants_count),
                row.category_name,
                row.brand_name,
                row.base_unit_label,
                PRODUCT_TYPE_LABELS[row.type],
                row.is_active ? 'activo' : 'inactivo',
            ]
                .filter(Boolean)
                .join(' '),
        [],
    );

    const renderActions = useCallback(
        (product: ProductRow) => (
            <>
                {abilities.canViewStock &&
                product.track_stock &&
                product.type === 'good' &&
                onViewStock ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg text-cyan-700 transition-all duration-200 hover:bg-cyan-600 hover:text-white hover:shadow-md hover:shadow-cyan-300/40 active:scale-95"
                        onClick={() => onViewStock(product)}
                        aria-label={`Ver stock de ${product.name}`}
                    >
                        <Package className="size-4" />
                    </Button>
                ) : null}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                    onClick={() => onOpen(product)}
                    aria-label={`Abrir ficha de ${product.name}`}
                >
                    {abilities.canUpdate ? (
                        <Pencil className="size-4" />
                    ) : (
                        <ExternalLink className="size-4" />
                    )}
                </Button>
                {abilities.canDelete && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-300/40 active:scale-95"
                        onClick={() => onDelete(product)}
                        aria-label={`Eliminar ${product.name}`}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </>
        ),
        [abilities, onOpen, onDelete, onViewStock],
    );

    return (
        <DataTable
            data={products}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar producto…"
            emptyMessage="No hay productos. Crea el primero con «Nuevo producto»."
            emptyFilteredMessage="Ningún producto coincide con tu búsqueda."
            renderActions={hasActions ? renderActions : undefined}
            onFilteredCountChange={onFilteredCountChange}
            className="min-w-0 [&_table]:table-fixed"
        />
    );
}
