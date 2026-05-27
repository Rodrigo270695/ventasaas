import { usePage } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import type { Auth } from '@/types/auth';

export function useCan() {
    const permissions = usePage<{ auth: Auth }>().props.auth.permissions ?? [];

    const permissionSet = useMemo(() => new Set(permissions), [permissions]);

    const can = useCallback(
        (permission: string) => permissionSet.has(permission),
        [permissionSet],
    );

    const canAny = useCallback(
        (...names: string[]) => names.some((name) => permissionSet.has(name)),
        [permissionSet],
    );

    return { can, canAny, permissions };
}
