/** Valores para input[type=datetime-local] y envío al backend (hora Perú / app). */

export function toDatetimeLocalValue(
    value: string | null | undefined,
): string {
    if (!value) {
        return '';
    }

    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
        return trimmed.slice(0, 16);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return `${trimmed}T12:00`;
    }

    const normalized = trimmed.includes('T')
        ? trimmed
        : trimmed.replace(' ', 'T');

    const d = new Date(normalized);

    if (Number.isNaN(d.getTime())) {
        return '';
    }

    const pad = (n: number) => String(n).padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Formato legible dd/mm/yyyy HH:mm */
export function formatPeruDateTimeLabel(
    value: string | null | undefined,
): string {
    if (!value) {
        return '—';
    }

    const local = toDatetimeLocalValue(value);

    if (!local) {
        return value;
    }

    const [datePart, timePart] = local.split('T');
    const [y, m, d] = datePart.split('-');

    return `${d}/${m}/${y} ${timePart}`;
}

/** Envío a Laravel: Y-m-d H:i:s */
export function datetimeLocalToServer(value: string): string {
    if (!value) {
        return '';
    }

    const [date, time] = value.split('T');

    return `${date} ${time}:00`;
}

export function nowDatetimeLocalValue(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
