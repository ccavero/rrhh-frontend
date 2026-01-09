export function pad2(n: number) {
    return n.toString().padStart(2, '0');
}

export function toISODate(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function daysInMonth(year: number, monthIndex0: number): number {
    return new Date(year, monthIndex0 + 1, 0).getDate();
}

export function isWeekendISO(isoDate: string): boolean {
    const [y, m, d] = isoDate.split('-').map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    const day = dt.getDay();
    return day === 0 || day === 6;
}

export function formatMinutos(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${pad2(h)}:${pad2(m)}`;
}