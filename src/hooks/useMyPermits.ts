'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Permiso } from '../lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export function useMyPermits(token: string | null) {
    const [permisos, setPermisos] = useState<Permiso[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function cargar() {
        if (!token) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/permisos/mios`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                setError(data?.message ?? 'Error al obtener tus permisos.');
                return;
            }

            setPermisos((data ?? []) as Permiso[]);
        } catch {
            setError('Error de conexión al cargar permisos.');
        } finally {
            setLoading(false);
        }
    }

    async function solicitar(payload: { tipo: string; motivo: string; fecha_inicio: string; fecha_fin: string }) {
        if (!token) return;
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/permisos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                setError(data?.message ?? 'No se pudo solicitar el permiso.');
                return;
            }

            await cargar();
        } catch {
            setError('Error de conexión al solicitar permiso.');
        } finally {
            setSubmitting(false);
        }
    }

    useEffect(() => {
        void cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const pendientes = useMemo(() => permisos.filter((p) => p.estado === 'PENDIENTE'), [permisos]);
    const aprobados = useMemo(() => permisos.filter((p) => p.estado === 'APROBADO'), [permisos]);

    return {
        permisos,
        pendientes,
        aprobados,
        loading,
        submitting,
        error,
        setError,
        reload: cargar,
        solicitar,
    };
}