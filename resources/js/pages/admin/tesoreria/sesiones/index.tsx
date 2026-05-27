import { Head, Link, router, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
    AdminListStatusFilter,
    ALL_LIST_STATUS,
} from '@/components/admin/admin-list-status-filter';
import { CashSessionsTable } from '@/components/admin/tesoreria/cash-sessions-table';
import { CloseCashSessionModal } from '@/components/admin/tesoreria/close-cash-session-modal';
import { OpenCashSessionModal } from '@/components/admin/tesoreria/open-cash-session-modal';
import { Button } from '@/components/ui/button';
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
import { useCashSessionsModals } from '@/hooks/use-cash-sessions-modals';
import { tesoreriaSesionesIndex } from '@/lib/admin-breadcrumbs';
import { TREASURY_CASH_SESSIONS_PERMISSIONS } from '@/lib/admin-permissions';
import { CASH_SESSION_STAT_ICONS } from '@/lib/treasury-cash-session-stat-icons';
import { index as cajasIndex } from '@/routes/admin/tesoreria/cajas';
import { index as sessionsIndex } from '@/routes/admin/tesoreria/sesiones';
import type {
    CashSessionStatItem,
    CashSessionsIndexPageProps,
    CashSessionsPageErrors,
} from '@/types/admin/treasury';

const STATUS_OPTIONS = [
    { value: ALL_LIST_STATUS, label: 'Todas' },
    { value: 'open', label: 'Abiertas' },
    { value: 'closed', label: 'Cerradas' },
];

type PageProps = CashSessionsIndexPageProps & {
    errors?: CashSessionsPageErrors;
};

export default function CashSessionsIndex({
    sessions,
    cashRegisterOptions,
    userOpenSession,
    filters,
    stats,
    openSessionModal = false,
    sessionCloseModalId = null,
    oldForm,
}: CashSessionsIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();
    const [filteredCount, setFilteredCount] = useState(sessions.length);
    const [status, setStatus] = useState(filters.status ?? '');

    const modals = useCashSessionsModals(sessions, {
        openSessionModal,
        sessionCloseModalId,
    });

    const applyStatus = useCallback((next: string) => {
        setStatus(next);
        router.get(
            sessionsIndex.url({
                query: next ? { status: next } : {},
            }),
            {},
            { preserveState: true, replace: true },
        );
    }, []);

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: CashSessionStatItem) => {
        return stat.icon ?? CASH_SESSION_STAT_ICONS[stat.key];
    }, []);

    const statusToolbar = useMemo(
        () => (
            <AdminListStatusFilter
                id="cash-sessions-status"
                value={status}
                options={STATUS_OPTIONS}
                onValueChange={applyStatus}
                placeholder="Estado…"
                aria-label="Filtrar sesiones por estado"
            />
        ),
        [status, applyStatus],
    );

    const showFilteredBadge = filteredCount !== sessions.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Sesiones de caja" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Sesiones de caja"
                        description="Apertura, cobros vinculados y cierre con arqueo de efectivo."
                    />
                    <PageHeaderActions>
                        {can(TREASURY_CASH_SESSIONS_PERMISSIONS.OPEN) &&
                        !userOpenSession ? (
                            <PageHeaderNewButton
                                onClick={() => modals.openOpenSession()}
                                label="Abrir sesión"
                            />
                        ) : null}
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

            {userOpenSession ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
                    <span>
                        Tu sesión abierta:{' '}
                        <strong>{userOpenSession.cash_register_name}</strong>{' '}
                        desde {userOpenSession.opened_at_label} · Fondo PEN{' '}
                        {userOpenSession.opening_float_label}
                    </span>
                    {can(TREASURY_CASH_SESSIONS_PERMISSIONS.CLOSE) ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer border-emerald-300"
                            onClick={() => {
                                const session = sessions.find(
                                    (s) => s.id === userOpenSession.id,
                                );

                                if (session) {
                                    modals.openCloseSession(session);
                                }
                            }}
                        >
                            Cerrar mi sesión
                        </Button>
                    ) : null}
                </div>
            ) : (
                <p className="text-sm text-[#6b5b7a]">
                    Abre una sesión para que los cobros en comprobantes queden
                    vinculados al arqueo.{' '}
                    <Link
                        href={cajasIndex.url()}
                        className="text-[#7c3aed] hover:underline"
                    >
                        Gestionar cajas
                    </Link>
                </p>
            )}

            <CashSessionsTable
                sessions={sessions}
                onClose={modals.openCloseSession}
                onFilteredCountChange={handleFilteredCountChange}
                toolbarEnd={statusToolbar}
            />

            {can(TREASURY_CASH_SESSIONS_PERMISSIONS.OPEN) && (
                <OpenCashSessionModal
                    open={modals.openModal}
                    onOpenChange={modals.handleOpenModalChange}
                    cashRegisterOptions={cashRegisterOptions}
                    errors={modals.openModal ? errors : {}}
                    oldForm={modals.openModal ? oldForm : undefined}
                />
            )}

            {can(TREASURY_CASH_SESSIONS_PERMISSIONS.CLOSE) && (
                <CloseCashSessionModal
                    open={modals.closeModal}
                    onOpenChange={modals.handleCloseModalChange}
                    session={modals.closingSession}
                    errors={modals.closeModal ? errors : {}}
                />
            )}
        </div>
    );
}

CashSessionsIndex.layout = {
    breadcrumbs: tesoreriaSesionesIndex(),
};
