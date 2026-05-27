import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as sessionsIndex } from '@/routes/admin/tesoreria/sesiones';
import type {
    CashRegisterSessionRow,
    CashSessionsIndexPageProps,
} from '@/types/admin/treasury';

export type CashSessionsModalFlash = Pick<
    CashSessionsIndexPageProps,
    'openSessionModal' | 'sessionCloseModalId'
>;

const sessionsIndexResetUrl = sessionsIndex.url({
    query: { _reset: 1 },
});

function buildInitialOpenState(
    openSessionModal: CashSessionsIndexPageProps['openSessionModal'],
): boolean {
    return Boolean(openSessionModal);
}

function findClosingSession(
    sessionCloseModalId: CashSessionsIndexPageProps['sessionCloseModalId'],
    sessions: CashRegisterSessionRow[],
): CashRegisterSessionRow | null {
    if (!sessionCloseModalId) {
        return null;
    }

    return sessions.find((s) => s.id === sessionCloseModalId) ?? null;
}

export function useCashSessionsModals(
    sessions: CashRegisterSessionRow[],
    flash: CashSessionsModalFlash,
) {
    const initialClosing = findClosingSession(
        flash.sessionCloseModalId,
        sessions,
    );

    const [openModal, setOpenModal] = useState(
        buildInitialOpenState(flash.openSessionModal),
    );
    const [closeModal, setCloseModal] = useState(initialClosing !== null);
    const [closingSession, setClosingSession] =
        useState<CashRegisterSessionRow | null>(initialClosing);

    const resetFlash = useCallback(() => {
        router.visit(sessionsIndexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const handleOpenModalChange = useCallback(
        (open: boolean) => {
            setOpenModal(open);

            if (!open) {
                resetFlash();
            }
        },
        [resetFlash],
    );

    const handleCloseModalChange = useCallback(
        (open: boolean) => {
            setCloseModal(open);

            if (!open) {
                setClosingSession(null);
                resetFlash();
            }
        },
        [resetFlash],
    );

    const openCloseSession = useCallback((session: CashRegisterSessionRow) => {
        setClosingSession(session);
        setCloseModal(true);
    }, []);

    const openOpenSession = useCallback(() => {
        setOpenModal(true);
    }, []);

    return {
        openModal,
        closeModal,
        closingSession,
        handleOpenModalChange,
        handleCloseModalChange,
        openCloseSession,
        openOpenSession,
    };
}
