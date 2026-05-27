import { Head, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { DocumentSeriesDeleteModal } from '@/components/admin/documentos/document-series-delete-modal';
import { DocumentSeriesFormModal } from '@/components/admin/documentos/document-series-form-modal';
import { DocumentSeriesTable } from '@/components/admin/documentos/document-series-table';
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
import { useDocumentSeriesModals } from '@/hooks/use-document-series-modals';
import { documentosSeriesIndex } from '@/lib/admin-breadcrumbs';
import { DOCUMENT_SERIES_PERMISSIONS } from '@/lib/admin-permissions';
import { DOCUMENT_SERIES_STAT_ICONS } from '@/lib/document-series-stat-icons';
import type {
    DocumentSeriesIndexPageProps,
    DocumentSeriesPageErrors,
    DocumentSeriesStatItem,
} from '@/types/admin/document-series';

type PageProps = DocumentSeriesIndexPageProps & {
    errors?: DocumentSeriesPageErrors;
};

export default function DocumentSeriesIndex({
    documentSeries,
    stats,
    documentSeriesModal = null,
    documentSeriesModalId = null,
    oldForm,
}: DocumentSeriesIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const [filteredCount, setFilteredCount] = useState(documentSeries.length);

    const modals = useDocumentSeriesModals(documentSeries, {
        documentSeriesModal,
        documentSeriesModalId,
    });

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(DOCUMENT_SERIES_PERMISSIONS.UPDATE),
            canDelete: can(DOCUMENT_SERIES_PERMISSIONS.DELETE),
        }),
        [can],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: DocumentSeriesStatItem) => {
        return stat.icon ?? DOCUMENT_SERIES_STAT_ICONS[stat.key];
    }, []);

    const showFilteredBadge = filteredCount !== documentSeries.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Series y numeración" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Series y numeración"
                        description="Series SUNAT y correlativos para facturas, boletas y otros comprobantes."
                    />
                    <PageHeaderActions>
                        {can(DOCUMENT_SERIES_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton onClick={modals.openCreate}>
                                Nueva serie
                            </PageHeaderNewButton>
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

            <DocumentSeriesTable
                rows={documentSeries}
                abilities={tableAbilities}
                onEdit={modals.openEdit}
                onDelete={modals.openDelete}
                onFilteredCountChange={handleFilteredCountChange}
            />

            <DocumentSeriesFormModal
                open={modals.formOpen}
                onOpenChange={modals.handleFormOpenChange}
                mode={modals.formMode}
                row={modals.editingRow}
                oldForm={modals.formOpen ? oldForm : undefined}
                errors={modals.formOpen ? errors : {}}
            />

            <DocumentSeriesDeleteModal
                open={modals.deleteOpen}
                onOpenChange={modals.handleDeleteOpenChange}
                row={modals.deletingRow}
            />
        </div>
    );
}

DocumentSeriesIndex.layout = {
    breadcrumbs: documentosSeriesIndex(),
};
