import { createInertiaApp } from '@inertiajs/react';
import { registerSW } from 'virtual:pwa-register';
import { OfflineStatusBanner } from '@/components/offline/offline-status-banner';
import { OfflineSyncManager } from '@/components/offline/offline-sync-manager';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import ChokoLoginLayout from '@/layouts/auth/choko-login-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Choko House';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name.endsWith('/ticket'):
            case name === 'compras/orden-confirmada':
                return null;
            case name === 'auth/login':
                return (page) => (
                    <ChokoLoginLayout
                        title="Panel interno"
                        description="Acceso exclusivo para el equipo de trabajo"
                    >
                        {page}
                    </ChokoLoginLayout>
                );
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                <OfflineStatusBanner />
                <OfflineSyncManager />
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

registerSW({ immediate: true });
