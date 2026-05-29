export function formatExpiryDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(`${value}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function expiryStatusLabel(
    expiresAt: string | null,
    isExpired: boolean,
    isExpiringSoon: boolean,
    daysUntilExpiry: number | null,
): string | null {
    if (!expiresAt) {
        return null;
    }

    if (isExpired) {
        const days = Math.abs(daysUntilExpiry ?? 0);
        return days === 0 ? 'Vencido hoy' : `Vencido hace ${days} día${days === 1 ? '' : 's'}`;
    }

    if (isExpiringSoon && daysUntilExpiry !== null) {
        return daysUntilExpiry === 0
            ? 'Vence hoy'
            : `Vence en ${daysUntilExpiry} día${daysUntilExpiry === 1 ? '' : 's'}`;
    }

    return null;
}
