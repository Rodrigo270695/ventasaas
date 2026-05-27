import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { useCan } from '@/hooks/use-can';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import { SALES_INTERNAL_PERMISSIONS } from '@/lib/admin-permissions';
import {
    isQuickSaleCreatePath,
    QUICK_SALE_CREATE_PATH,
} from '@/lib/offline-quick-sale';

const OFFLINE_ALLOWED_PREFIXES = [
    QUICK_SALE_CREATE_PATH,
    '/admin/catalogo/categorias',
    '/admin/catalogo/productos',
    '/admin/socios',
    '/admin/ventas/cotizaciones',
];

function isOfflineAllowedPath(path: string): boolean {
    return OFFLINE_ALLOWED_PREFIXES.some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );
}

export function OfflineQuickSaleRedirect() {
    const { isOffline } = useOfflineStatus();
    const { currentUrl } = useCurrentUrl();
    const { can } = useCan();

    useEffect(() => {
        if (!isOffline) {
            return;
        }

        if (!can(SALES_INTERNAL_PERMISSIONS.CREATE)) {
            return;
        }

        if (isQuickSaleCreatePath(currentUrl) || isOfflineAllowedPath(currentUrl)) {
            return;
        }

        router.visit(QUICK_SALE_CREATE_PATH, {
            replace: true,
            preserveState: false,
        });
    }, [isOffline, currentUrl, can]);

    return null;
}
