import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export type ToastType = FlashToast['type'];

type NotifyOptions = {
    description?: string;
    duration?: number;
};

function show(type: ToastType, message: string, options?: NotifyOptions) {
    const payload = {
        description: options?.description,
        duration: options?.duration ?? 4000,
    };

    switch (type) {
        case 'success':
            toast.success(message, payload);
            break;
        case 'error':
            toast.error(message, payload);
            break;
        case 'warning':
            toast.warning(message, payload);
            break;
        case 'info':
            toast.info(message, payload);
            break;
    }
}

/** API de notificaciones toast (Choko). */
export const notify = {
    success: (message: string, options?: NotifyOptions) =>
        show('success', message, options),
    error: (message: string, options?: NotifyOptions) =>
        show('error', message, options),
    warning: (message: string, options?: NotifyOptions) =>
        show('warning', message, options),
    info: (message: string, options?: NotifyOptions) =>
        show('info', message, options),
    show,
    fromFlash: (data: FlashToast) => show(data.type, data.message),
};
