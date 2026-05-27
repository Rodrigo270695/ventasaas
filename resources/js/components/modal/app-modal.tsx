import type { ReactNode } from 'react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { ComboboxPortalTargetContext } from '@/components/modal/combobox-portal-context';
import { cn } from '@/lib/utils';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
};

const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-3xl',
};

const overlayAnimation =
    'duration-300 ease-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0';

/** Solo zoom/fade: slide rompe `translate` de centrado en DialogContent. */
const contentAnimation = cn(
    'duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
);

function isComboboxPortalTarget(target: EventTarget | null): boolean {
    return (
        target instanceof Element &&
        Boolean(target.closest('[data-combobox-listbox]'))
    );
}

function preventOutsideClose(event: Event) {
    event.preventDefault();
}

function handleDialogOutsideEvent(event: Event) {
    if (isComboboxPortalTarget(event.target)) {
        return;
    }

    preventOutsideClose(event);
}

/**
 * Modal reutilizable (padre). Compón con AppModalHeader, AppModalBody y AppModalFooter.
 * No se cierra al hacer clic fuera; sí con Esc o el botón cerrar.
 */
export function AppModal({
    open,
    onOpenChange,
    children,
    className,
    size = 'md',
}: Props) {
    const [comboboxPortalTarget, setComboboxPortalTarget] =
        useState<HTMLElement | null>(null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                overlayClassName={overlayAnimation}
                onInteractOutside={handleDialogOutsideEvent}
                onPointerDownOutside={handleDialogOutsideEvent}
                className={cn(
                    '!fixed top-1/2 left-1/2 z-50 !flex w-full min-w-0 -translate-x-1/2 -translate-y-1/2 flex-col',
                    'max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden rounded-2xl border-violet-200/80 p-0 shadow-xl shadow-violet-200/30',
                    contentAnimation,
                    sizeClasses[size],
                    className,
                )}
            >
                <ComboboxPortalTargetContext.Provider
                    value={comboboxPortalTarget}
                >
                    <div
                        ref={setComboboxPortalTarget}
                        className="pointer-events-none absolute inset-0 z-[60] overflow-visible"
                        aria-hidden
                    />
                    <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col">
                        {children}
                    </div>
                </ComboboxPortalTargetContext.Provider>
            </DialogContent>
        </Dialog>
    );
}
