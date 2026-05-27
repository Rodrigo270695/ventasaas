/** Rango de la semana actual (lunes a domingo, YYYY-MM-DD). */
export function getCurrentWeekDateRange(): { from: string; to: string } {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
        from: formatDateOnly(monday),
        to: formatDateOnly(sunday),
    };
}

function formatDateOnly(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
}
