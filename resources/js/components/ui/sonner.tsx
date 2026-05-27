import {
    CircleAlert,
    CircleCheck,
    CircleX,
    Info,
} from 'lucide-react';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance === 'dark' ? 'dark' : 'light'}
            className="toaster group"
            position="top-right"
            closeButton
            richColors={false}
            gap={10}
            offset={16}
            icons={{
                success: (
                    <CircleCheck
                        className="size-5 shrink-0 text-emerald-600"
                        aria-hidden
                    />
                ),
                error: (
                    <CircleX
                        className="size-5 shrink-0 text-red-600"
                        aria-hidden
                    />
                ),
                warning: (
                    <CircleAlert
                        className="size-5 shrink-0 text-amber-600"
                        aria-hidden
                    />
                ),
                info: (
                    <Info
                        className="size-5 shrink-0 text-blue-600"
                        aria-hidden
                    />
                ),
            }}
            toastOptions={{
                classNames: {
                    toast: 'choko-toast-item',
                    title: 'choko-toast-title',
                    description: 'choko-toast-description',
                    closeButton: 'choko-toast-close cursor-pointer',
                },
            }}
            {...props}
        />
    );
}

export { Toaster };
