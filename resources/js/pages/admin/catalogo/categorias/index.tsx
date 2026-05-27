import { Head, usePage } from '@inertiajs/react';
import { CloudOff, ListFilter } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CategoriesTable } from '@/components/admin/catalogo/categories-table';
import { CategoryDeleteModal } from '@/components/admin/catalogo/category-delete-modal';
import { CategoryFormModal } from '@/components/admin/catalogo/category-form-modal';
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
import { useCategoriesModals } from '@/hooks/use-categories-modals';
import { useOfflineCategories } from '@/hooks/use-offline-categories';
import { catalogoCategoriasIndex } from '@/lib/admin-breadcrumbs';
import { CATEGORIES_PERMISSIONS } from '@/lib/admin-permissions';
import { CATEGORY_STAT_ICONS } from '@/lib/category-stat-icons';
import { notify } from '@/lib/notify';
import type {
    CategoriesIndexPageProps,
    CategoriesPageErrors,
    CategoryStatItem,
} from '@/types/admin/categories';

type PageProps = CategoriesIndexPageProps & {
    errors?: CategoriesPageErrors;
};

export default function CategoriesIndex({
    categories: serverCategories,
    parentOptions: serverParentOptions,
    stats: serverStats,
    categoryModal = null,
    categoryModalCategoryId = null,
    oldForm,
}: CategoriesIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const {
        categories,
        parentOptions,
        stats,
        isOffline,
        pendingCount,
        createOffline,
        updateOffline,
        deleteOffline,
    } = useOfflineCategories({
        serverCategories,
        serverParentOptions,
        serverStats,
    });

    const [filteredCount, setFilteredCount] = useState(categories.length);

    useEffect(() => {
        setFilteredCount(categories.length);
    }, [categories.length]);

    const modals = useCategoriesModals(categories, {
        categoryModal,
        categoryModalCategoryId,
        isOffline,
    });

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(CATEGORIES_PERMISSIONS.UPDATE),
            canDelete: can(CATEGORIES_PERMISSIONS.DELETE),
        }),
        [can],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: CategoryStatItem) => {
        return stat.icon ?? CATEGORY_STAT_ICONS[stat.key];
    }, []);

    const showFilteredBadge = filteredCount !== categories.length;

    const handleOfflineCreate = useCallback(
        (payload: Parameters<typeof createOffline>[0]) => {
            createOffline(payload);
            notify.success('Categoría guardada localmente', {
                description: 'Se sincronizará al reconectar internet.',
            });
        },
        [createOffline],
    );

    const handleOfflineUpdate = useCallback(
        (categoryId: string, payload: Parameters<typeof updateOffline>[1]) => {
            updateOffline(categoryId, payload);
            notify.success('Cambios guardados localmente', {
                description: 'Se sincronizarán al reconectar internet.',
            });
        },
        [updateOffline],
    );

    const handleOfflineDelete = useCallback(
        (categoryId: string) => {
            deleteOffline(categoryId);
            notify.success('Eliminación pendiente', {
                description: 'Se aplicará al reconectar internet.',
            });
        },
        [deleteOffline],
    );

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Categorías" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Categorías"
                        description="Jerarquía de categorías para organizar el catálogo."
                    />
                    <PageHeaderActions>
                        {can(CATEGORIES_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton
                                onClick={() => modals.openCreate()}
                                label="Nueva categoría"
                            />
                        )}
                    </PageHeaderActions>
                </PageHeaderTop>

                <PageHeaderBadges>
                    {isOffline && (
                        <StatBadge
                            label="Modo offline"
                            value="Activo"
                            tone="amber"
                            icon={CloudOff}
                        />
                    )}
                    {pendingCount > 0 && (
                        <StatBadge
                            label="Pendientes sync"
                            value={pendingCount}
                            tone="pink"
                            icon={CloudOff}
                        />
                    )}
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

            <CategoriesTable
                categories={categories}
                abilities={tableAbilities}
                onEdit={modals.openEdit}
                onDelete={modals.openDelete}
                onFilteredCountChange={handleFilteredCountChange}
            />

            {(can(CATEGORIES_PERMISSIONS.CREATE) ||
                can(CATEGORIES_PERMISSIONS.UPDATE)) && (
                <CategoryFormModal
                    open={modals.formOpen}
                    onOpenChange={modals.handleFormOpenChange}
                    mode={modals.formMode}
                    category={modals.editingCategory}
                    parentOptions={parentOptions}
                    errors={modals.formOpen ? errors : {}}
                    oldForm={modals.formOpen ? oldForm : undefined}
                    isOffline={isOffline}
                    onOfflineCreate={handleOfflineCreate}
                    onOfflineUpdate={handleOfflineUpdate}
                />
            )}

            {can(CATEGORIES_PERMISSIONS.DELETE) && (
                <CategoryDeleteModal
                    open={modals.deleteOpen}
                    onOpenChange={modals.handleDeleteOpenChange}
                    category={modals.deletingCategory}
                    isOffline={isOffline}
                    onOfflineDelete={handleOfflineDelete}
                />
            )}
        </div>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: catalogoCategoriasIndex(),
};
