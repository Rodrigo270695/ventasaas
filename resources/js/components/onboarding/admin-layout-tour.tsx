import { router, usePage } from '@inertiajs/react';
import { driver, type DriveStep, type Driver } from 'driver.js';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    type ReactNode,
} from 'react';
import { adminMainNavItem, adminNavGroups } from '@/config/admin-navigation';
import { buildNavGroupTourStep } from '@/config/admin-tour';
import { useCan } from '@/hooks/use-can';
import { useIsMobile } from '@/hooks/use-mobile';
import { filterNavGroups } from '@/lib/admin-navigation-access';
import type { Auth } from '@/types/auth';
import 'driver.js/dist/driver.css';

type AdminLayoutTourContextValue = {
    startTour: () => void;
    isRunning: boolean;
};

const AdminLayoutTourContext = createContext<AdminLayoutTourContextValue | null>(
    null,
);

function ensureSidebarExpanded(): void {
    const collapsed = document.querySelector(
        '[data-slot="sidebar"][data-state="collapsed"]',
    );

    if (collapsed) {
        document
            .querySelector<HTMLButtonElement>('[data-tour="sidebar-trigger"]')
            ?.click();
    }
}

function expandNavGroup(selector: string): void {
    const target = document.querySelector(selector);
    const closed = target?.querySelector('[data-state="closed"]');

    if (closed) {
        target?.querySelector<HTMLButtonElement>('button')?.click();
    }
}

const LAYOUT_TOUR_STORAGE_PREFIX = 'choko-layout-tour-seen';

function layoutTourStorageKey(userId: number): string {
    return `${LAYOUT_TOUR_STORAGE_PREFIX}-${userId}`;
}

function hasSeenLayoutTour(user: Auth['user']): boolean {
    if (!user) {
        return true;
    }

    if (user.layout_tour_completed_at) {
        return true;
    }

    try {
        return sessionStorage.getItem(layoutTourStorageKey(user.id)) === '1';
    } catch {
        return false;
    }
}

function persistLayoutTourSeen(userId: number): void {
    try {
        sessionStorage.setItem(layoutTourStorageKey(userId), '1');
    } catch {
        // sessionStorage no disponible
    }

    router.patch(
        '/settings/onboarding/layout-tour',
        {},
        { preserveScroll: true, preserveState: true },
    );
}

export function AdminLayoutTourProvider({ children }: { children: ReactNode }) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { can, canAny } = useCan();
    const isMobile = useIsMobile();
    const driverRef = useRef<Driver | null>(null);
    const autoStartedRef = useRef(false);
    const isRunningRef = useRef(false);

    const visibleGroups = useMemo(
        () => filterNavGroups(adminNavGroups, can, canAny),
        [can, canAny],
    );

    const hasFavoritesSection = useMemo(() => {
        const favoritePermissions = [
            'products.view',
            'categories.view',
            'sales.view',
            'sales.quotations.view',
            'purchases.view',
            'stock_balances.view',
            'stock_movements.view',
            'treasury.collections.view',
            'treasury.disbursements.view',
            'electronic_documents.view',
            'document_series.view',
            'users.view',
            'roles.view',
            'audit.view',
        ];

        return favoritePermissions.some((permission) => can(permission));
    }, [can]);

    const buildSteps = useCallback((): DriveStep[] => {
        const steps: DriveStep[] = [
            {
                popover: {
                    title: 'Bienvenido al panel',
                    description:
                        'Te mostraremos cómo usar el menú lateral, los accesos rápidos y los módulos del sistema. Esta guía inicial solo se muestra una vez; después puedes abrirla con «Ver guía».',
                    side: 'over',
                    align: 'center',
                    showButtons: ['next', 'close'],
                },
            },
            {
                element: '[data-tour="sidebar-trigger"]',
                popover: {
                    title: 'Abrir y cerrar el menú',
                    description:
                        'Usa este botón para expandir o contraer el menú lateral. También puedes usar Ctrl+B (o Cmd+B en Mac).',
                    side: 'bottom',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="sidebar-brand"]',
                popover: {
                    title: 'Inicio y marca',
                    description:
                        'El logo te lleva al dashboard principal con indicadores de ventas, inventario y alertas.',
                    side: 'right',
                    align: 'start',
                },
            },
            {
                element: '[data-tour="nav-home"]',
                popover: {
                    title: adminMainNavItem.title,
                    description:
                        'Acceso directo al panel de inicio con resumen del negocio.',
                    side: 'right',
                    align: 'start',
                },
            },
        ];

        if (hasFavoritesSection) {
            steps.push({
                element: '[data-tour="nav-favorites"]',
                popover: {
                    title: 'Favoritos',
                    description:
                        'Tus accesos directos personalizados (hasta 4). Pulsa «Editar» para elegir qué pantallas aparecen aquí.',
                    side: 'right',
                    align: 'start',
                },
            });
        }

        steps.push({
            element: '[data-tour="nav-modules"]',
            popover: {
                title: 'Módulos del ERP',
                description:
                    'Cada bloque agrupa un área del negocio. Haz clic en un módulo para ver sus pantallas internas.',
                side: 'right',
                align: 'start',
            },
        });

        visibleGroups.forEach((group) => {
            steps.push(buildNavGroupTourStep(group));
        });

        steps.push(
            {
                element: '[data-tour="nav-user"]',
                popover: {
                    title: 'Tu cuenta',
                    description:
                        'Desde aquí accedes a perfil, seguridad, apariencia y cierre de sesión.',
                    side: 'right',
                    align: 'end',
                },
            },
            {
                element: '[data-tour="tour-help-button"]',
                popover: {
                    title: 'Repetir la guía',
                    description:
                        'Cuando lo necesites, vuelve a abrir este recorrido con «Ver guía».',
                    side: 'bottom',
                    align: 'end',
                },
            },
        );

        return steps;
    }, [hasFavoritesSection, visibleGroups]);

    const startTour = useCallback(
        (_options?: { auto?: boolean }) => {
            if (isRunningRef.current) {
                return;
            }

            ensureSidebarExpanded();

            const steps = buildSteps();

            const driverObj = driver({
                showProgress: true,
                progressText: '{{current}} de {{total}}',
                nextBtnText: 'Siguiente',
                prevBtnText: 'Anterior',
                doneBtnText: 'Finalizar',
                allowClose: true,
                overlayOpacity: 0.55,
                stagePadding: 8,
                stageRadius: 12,
                popoverClass: 'choko-driver-popover',
                steps,
                onHighlightStarted: (element) => {
                    ensureSidebarExpanded();

                    const tourId = element?.getAttribute('data-tour');

                    if (tourId?.startsWith('nav-group-')) {
                        expandNavGroup(`[data-tour="${tourId}"]`);
                    }
                },
                onNextClick: (_element, _step, { driver: activeDriver }) => {
                    activeDriver.moveNext();
                },
                onCloseClick: (_element, _step, { driver: activeDriver }) => {
                    activeDriver.destroy();
                },
                onDestroyed: () => {
                    isRunningRef.current = false;
                    driverRef.current = null;
                },
            });

            isRunningRef.current = true;
            driverRef.current = driverObj;

            window.setTimeout(() => {
                driverObj.drive();
            }, 350);
        },
        [buildSteps],
    );

    useEffect(() => {
        if (
            autoStartedRef.current ||
            isMobile ||
            !auth.user ||
            hasSeenLayoutTour(auth.user)
        ) {
            return;
        }

        autoStartedRef.current = true;
        persistLayoutTourSeen(auth.user.id);

        const timer = window.setTimeout(() => {
            startTour({ auto: true });
        }, 900);

        return () => window.clearTimeout(timer);
    }, [auth.user, isMobile, startTour]);

    const value = useMemo(
        () => ({
            startTour: () => startTour(),
            isRunning: isRunningRef.current,
        }),
        [startTour],
    );

    return (
        <AdminLayoutTourContext.Provider value={value}>
            {children}
        </AdminLayoutTourContext.Provider>
    );
}

export function useAdminLayoutTour(): AdminLayoutTourContextValue {
    const context = useContext(AdminLayoutTourContext);

    if (!context) {
        throw new Error(
            'useAdminLayoutTour must be used within AdminLayoutTourProvider',
        );
    }

    return context;
}
