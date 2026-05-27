import { usePage } from '@inertiajs/react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    type ReactNode,
} from 'react';
import {
    findPageTourByPath,
    normalizePagePath,
    type PageTourDefinition,
} from '@/config/admin-page-tours';
import { useCan } from '@/hooks/use-can';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    hasSeenPageTour,
    persistPageTourSeen,
    resolvePageTourSteps,
    runPageDriverTour,
} from '@/lib/page-tour';
import type { Auth } from '@/types/auth';
import 'driver.js/dist/driver.css';

type AdminPageTourContextValue = {
    startPageTour: () => void;
    currentTour: PageTourDefinition | null;
};

const AdminPageTourContext = createContext<AdminPageTourContextValue | null>(
    null,
);

export function AdminPageTourProvider({ children }: { children: ReactNode }) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { currentUrl } = useCurrentUrl();
    const { can, canAny } = useCan();
    const isMobile = useIsMobile();
    const isRunningRef = useRef(false);
    const autoStartedRef = useRef<string | null>(null);

    const currentTour = useMemo(
        () => findPageTourByPath(currentUrl),
        [currentUrl],
    );

    const startPageTour = useCallback(() => {
        if (isRunningRef.current || !currentTour || !auth.user) {
            return;
        }

        const steps = resolvePageTourSteps(currentTour.steps, can, canAny);

        if (steps.length === 0) {
            return;
        }

        isRunningRef.current = true;

        window.setTimeout(() => {
            const driverObj = runPageDriverTour(steps, {
                onDestroyed: () => {
                    isRunningRef.current = false;
                },
            });

            if (!driverObj) {
                isRunningRef.current = false;
            }
        }, 400);
    }, [auth.user, can, canAny, currentTour]);

    useEffect(() => {
        if (
            !currentTour ||
            !auth.user ||
            isMobile ||
            isRunningRef.current
        ) {
            return;
        }

        const path = normalizePagePath(currentUrl);

        if (autoStartedRef.current === path) {
            return;
        }

        if (
            hasSeenPageTour(
                auth.user.id,
                currentTour.id,
                auth.user.completed_page_tours,
            )
        ) {
            return;
        }

        autoStartedRef.current = path;
        persistPageTourSeen(auth.user.id, currentTour.id);

        const timer = window.setTimeout(() => {
            startPageTour();
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [auth.user, currentTour, currentUrl, isMobile, startPageTour]);

    const value = useMemo(
        () => ({
            startPageTour,
            currentTour: currentTour ?? null,
        }),
        [currentTour, startPageTour],
    );

    return (
        <AdminPageTourContext.Provider value={value}>
            {children}
        </AdminPageTourContext.Provider>
    );
}

export function useAdminPageTour(): AdminPageTourContextValue {
    const context = useContext(AdminPageTourContext);

    if (!context) {
        throw new Error(
            'useAdminPageTour must be used within AdminPageTourProvider',
        );
    }

    return context;
}
