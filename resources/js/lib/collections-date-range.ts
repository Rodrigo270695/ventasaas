/** Rango del mes calendario actual (YYYY-MM-DD). */
export function getCurrentMonthDateRange(): { from: string; to: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const from = formatDateOnly(new Date(year, month, 1));
    const to = formatDateOnly(new Date(year, month + 1, 0));

    return { from, to };
}

export function getTodayDateString(): string {
    return formatDateOnly(new Date());
}

function formatDateOnly(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
}
