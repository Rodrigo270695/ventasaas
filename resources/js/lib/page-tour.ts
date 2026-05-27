import { router } from '@inertiajs/react';
import { driver, type DriveStep, type Popover } from 'driver.js';
import type { PageTourStepDef } from '@/config/admin-page-tours';

const PAGE_TOUR_STORAGE_PREFIX = 'choko-page-tour-seen';

export function pageTourStorageKey(userId: number, tourId: string): string {
    return `${PAGE_TOUR_STORAGE_PREFIX}-${userId}-${tourId}`;
}

export function hasSeenPageTour(
    userId: number,
    tourId: string,
    completedPageTours: string[] | undefined,
): boolean {
    if (completedPageTours?.includes(tourId)) {
        return true;
    }

    try {
        return sessionStorage.getItem(pageTourStorageKey(userId, tourId)) === '1';
    } catch {
        return false;
    }
}

export function persistPageTourSeen(userId: number, tourId: string): void {
    try {
        sessionStorage.setItem(pageTourStorageKey(userId, tourId), '1');
    } catch {
        // sessionStorage no disponible
    }

    router.patch(
        '/settings/onboarding/page-tour',
        { tour_id: tourId },
        { preserveScroll: true, preserveState: true },
    );
}

function stepAllowed(
    step: PageTourStepDef,
    can: (permission: string) => boolean,
    canAny: (...permissions: string[]) => boolean,
): boolean {
    if (!step.permission) {
        return true;
    }

    const permissions = Array.isArray(step.permission)
        ? step.permission
        : [step.permission];

    if (step.requireAllPermissions) {
        return permissions.every((permission) => can(permission));
    }

    return canAny(...permissions);
}

export function resolvePageTourSteps(
    steps: PageTourStepDef[],
    can: (permission: string) => boolean,
    canAny: (...permissions: string[]) => boolean,
): DriveStep[] {
    return steps
        .filter((step) => stepAllowed(step, can, canAny))
        .filter((step) => {
            if (!step.element) {
                return true;
            }

            if (step.skipIfMissing === false) {
                return true;
            }

            return document.querySelector(step.element) !== null;
        })
        .map((step) => {
            const driveStep: DriveStep = {};

            if (step.element) {
                driveStep.element = step.element;
            }

            if (step.popover) {
                driveStep.popover = step.popover as Popover;
            }

            return driveStep;
        });
}

export function runPageDriverTour(
    steps: DriveStep[],
    options?: {
        onBeforeHighlight?: (element: Element | undefined) => void;
        onDestroyed?: () => void;
    },
): ReturnType<typeof driver> | null {
    if (steps.length === 0) {
        return null;
    }

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
            options?.onBeforeHighlight?.(element);
        },
        onNextClick: (_element, _step, { driver: activeDriver }) => {
            activeDriver.moveNext();
        },
        onCloseClick: (_element, _step, { driver: activeDriver }) => {
            activeDriver.destroy();
        },
        onDestroyed: () => {
            options?.onDestroyed?.();
        },
    });

    driverObj.drive();

    return driverObj;
}
