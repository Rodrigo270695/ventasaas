import { WifiOff } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/use-offline-status';

export function OfflineStatusBanner() {
    const { isOffline } = useOfflineStatus();

    if (!isOffline) {
        return null;
    }

    return (
        <div className="fixed inset-x-0 top-0 z-[120] border-b border-amber-300 bg-amber-100/95 px-3 py-2 text-center text-xs font-semibold text-amber-900 backdrop-blur">
            <span className="inline-flex items-center gap-1.5">
                <WifiOff className="size-3.5" />
                Navegando sin internet · Modo venta rápida. Los cambios se
                sincronizarán al reconectar.
            </span>
        </div>
    );
}
