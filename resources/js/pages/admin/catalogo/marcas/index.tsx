import { Head, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { BrandDeleteModal } from '@/components/admin/catalogo/brand-delete-modal';
import { BrandFormModal } from '@/components/admin/catalogo/brand-form-modal';
import { BrandsTable } from '@/components/admin/catalogo/brands-table';
import {
    PageHeader,
    PageHeaderActions,
    PageHeaderBadges,
    PageHeaderNewButton,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { useCan } from '@/hooks/use-can';
import { useBrandsModals } from '@/hooks/use-brands-modals';
import { catalogoMarcasIndex } from '@/lib/admin-breadcrumbs';
import { BRANDS_PERMISSIONS } from '@/lib/admin-permissions';
import { BRAND_STAT_ICONS } from '@/lib/brand-stat-icons';
import type {
    BrandStatItem,
    BrandsIndexPageProps,
    BrandsPageErrors,
} from '@/types/admin/brands';

type PageProps = BrandsIndexPageProps & {
    errors?: BrandsPageErrors;
};

export default function BrandsIndex({
    brands,
    stats,
    brandModal = null,
    brandModalBrandId = null,
    oldForm,
}: BrandsIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const [filteredCount, setFilteredCount] = useState(brands.length);

    const modals = useBrandsModals(brands, {
        brandModal,
        brandModalBrandId,
    });

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(BRANDS_PERMISSIONS.UPDATE),
            canDelete: can(BRANDS_PERMISSIONS.DELETE),
        }),
        [can],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: BrandStatItem) => {
        return stat.icon ?? BRAND_STAT_ICONS[stat.key];
    }, []);

    const showFilteredBadge = filteredCount !== brands.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Marcas" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Marcas"
                        description="Marcas comerciales para clasificar productos."
                    />
                    <PageHeaderActions>
                        {can(BRANDS_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton
                                onClick={() => modals.openCreate()}
                                label="Nueva marca"
                            />
                        )}
                    </PageHeaderActions>
                </PageHeaderTop>

                <PageHeaderBadges>
                    {stats.map((stat) => (
                        <StatBadge
                            key={stat.key}
                            label={stat.label}
                            value={stat.value}
                            tone={stat.tone}
                            icon={resolveStatIcon(stat)}
                        />
                    ))}
                    {showFilteredBadge && (
                        <StatBadge
                            label="Resultados"
                            value={filteredCount}
                            tone="pink"
                            icon={ListFilter}
                        />
                    )}
                </PageHeaderBadges>
            </PageHeader>

            <BrandsTable
                brands={brands}
                abilities={tableAbilities}
                onEdit={modals.openEdit}
                onDelete={modals.openDelete}
                onFilteredCountChange={handleFilteredCountChange}
            />

            {(can(BRANDS_PERMISSIONS.CREATE) ||
                can(BRANDS_PERMISSIONS.UPDATE)) && (
                <BrandFormModal
                    open={modals.formOpen}
                    onOpenChange={modals.handleFormOpenChange}
                    mode={modals.formMode}
                    brand={modals.editingBrand}
                    errors={modals.formOpen ? errors : {}}
                    oldForm={modals.formOpen ? oldForm : undefined}
                />
            )}

            {can(BRANDS_PERMISSIONS.DELETE) && (
                <BrandDeleteModal
                    open={modals.deleteOpen}
                    onOpenChange={modals.handleDeleteOpenChange}
                    brand={modals.deletingBrand}
                />
            )}
        </div>
    );
}

BrandsIndex.layout = {
    breadcrumbs: catalogoMarcasIndex(),
};
