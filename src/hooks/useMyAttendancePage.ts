// src/hooks/useMyAttendancePage.ts
'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

type EstadoDia = 'OK' | 'SIN_REGISTRO' | 'PERMISO' | 'FDS' | 'INCOMPLETO';

export type AsistenciaResumenDiario = {
    fecha: string; // YYYY-MM-DD
    horaEntrada: string; // HH:MM
    horaSalida: string; // HH:MM
    minutosTrabajados: number;
    minutosObjetivo?: number;
    estado: EstadoDia;
};

function pad2(n: number) {
    return n.toString().padStart(2, '0');
}

function toISODate(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function daysInMonth(year: number, monthIndex0: number): number {
    return new Date(year, monthIndex0 + 1, 0).getDate();
}

function isWeekendISO(isoDate: string): boolean {
    const [y, m, d] = isoDate.split('-').map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    const day = dt.getDay(); // 0 domingo, 6 sábado
    return day === 0 || day === 6;
}

export function useMyAttendancePage(token: string | null) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resumenDiario, setResumenDiario] = useState<AsistenciaResumenDiario[]>([]);

    useEffect(() => {
        if (!token) return;

        async function run() {
            setLoading(true);
            setError(null);

            try {
                const hoy = new Date();
                const fromDate = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                const toDate = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

                const from = toISODate(fromDate);
                const to = toISODate(toDate);

                const res = await fetch(
                    `${API_BASE_URL}/asistencia/mias/resumen-diario?from=${from}&to=${to}`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    setError(data?.message ?? 'Error al obtener el resumen diario.');
                    return;
                }

                const data = (await res.json()) as AsistenciaResumenDiario[];
                setResumenDiario(data);
            } catch {
                setError('Error de conexión al cargar asistencias.');
            } finally {
                setLoading(false);
            }
        }

        void run();
    }, [token]);

    const rowsMesCompleto = useMemo(() => {
        const hoy = new Date();
        const y = hoy.getFullYear();
        const m0 = hoy.getMonth();
        const total = daysInMonth(y, m0);

        const map = new Map<string, AsistenciaResumenDiario>();
        for (const r of resumenDiario) map.set(r.fecha, r);

        const rows: AsistenciaResumenDiario[] = [];
        for (let day = 1; day <= total; day++) {
            const iso = `${y}-${pad2(m0 + 1)}-${pad2(day)}`;
            const existing = map.get(iso);

            if (existing) {
                rows.push(existing);
            } else {
                const weekend = isWeekendISO(iso);
                rows.push({
                    fecha: iso,
                    horaEntrada: '00:00',
                    horaSalida: '00:00',
                    minutosTrabajados: 0,
                    estado: weekend ? 'FDS' : 'SIN_REGISTRO',
                });
            }
        }

        return rows;
    }, [resumenDiario]);

    return { error, setError, loading, rowsMesCompleto };
}