/** Condición tributaria SUNAT (p. ej. HABIDO / NO HABIDO). */
export function isSunatHabido(condicion: string | null | undefined): boolean | null {
    if (!condicion?.trim()) {
        return null;
    }

    const normalized = condicion.trim().toUpperCase();

    if (normalized.includes('NO HABIDO')) {
        return false;
    }

    if (normalized.includes('HABIDO')) {
        return true;
    }

    return null;
}

export function partySunatCondicionLabel(condicion: string | null | undefined): string {
    const habido = isSunatHabido(condicion);

    if (habido === true) {
        return 'Habido';
    }

    if (habido === false) {
        return 'No habido';
    }

    return condicion?.trim() ?? '';
}
