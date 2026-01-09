'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Rol } from '@/components/Sidebar';
import type { AsistenciaResumenDiario, Permiso, Usuario } from '@/lib/types';
import { api } from '@/lib/api';
import { daysInMonth, isWeekendISO, pad2, toISODate } from '@/lib/date';

export function useDashboardData(token: string | null, usuarioRol: Rol) {
    const esGestor = usuarioRol === 'ADMIN' || usuarioRol === 'RRHH';

    const [error, setError] = useState<string | null>(null);
    const [loadingGlobal, setLoadingGlobal] = useState(false);
    const [loadingAccion, setLoadingAccion] = useState<'ENTRADA' | 'SALIDA' | null>(null);

    const [resumenDiario, setResumenDiario] = useState<AsistenciaResumenDiario[]>([]);
    const [misPermisos, setMisPermisos] = useState<Permiso[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [permisosPendientes, setPermisosPendientes] = useState<Permiso[]>([]);

    async function refreshAll() {
        if (!token) return;

        setError(null);

        try {
            const hoy = new Date();
            const fromDate = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            const toDate = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
            const from = toISODate(fromDate);
            const to = toISODate(toDate);

            const [resumen, permisos] = await Promise.all([
                api.resumenDiarioMio(token, from, to),
                api.misPermisos(token),
            ]);

            setResumenDiario(resumen);
            setMisPermisos(permisos);

            if (esGestor) {
                setLoadingGlobal(true);
                try {
                    const [us, pend] = await Promise.all([
                        api.usuarios(token),
                        api.permisosPendientes(token),
                    ]);
                    setUsuarios(us);
                    setPermisosPendientes(pend);
                } finally {
                    setLoadingGlobal(false);
                }
            } else {
                setUsuarios([]);
                setPermisosPendientes([]);
            }
        } catch (e: any) {
            setError(e?.message ?? 'Error cargando dashboard.');
        }
    }

    useEffect(() => {
        void refreshAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, esGestor]);

    const hoyISO = useMemo(() => {
        const d = new Date();
        return toISODate(d);
    }, []);

    const hoyResumen = useMemo(() => {
        return resumenDiario.find((d) => d.fecha === hoyISO) ?? null;
    }, [resumenDiario, hoyISO]);

    // Estado UI para el botón:
    // - si hoy está OK => ya hubo entrada+salida => no permitir marcar más
    // - si hay entrada pero no salida => permitir SALIDA
    // - si no hay registro => permitir ENTRADA (pero NO si hoy es PERMISO/FDS)
    const quickAction = useMemo((): 'ENTRADA' | 'SALIDA' | 'NONE' => {
        if (!hoyResumen) return 'ENTRADA';
        if (hoyResumen.estado === 'PERMISO' || hoyResumen.estado === 'FDS') return 'NONE';
        if (hoyResumen.estado === 'OK') return 'NONE';
        if (hoyResumen.horaEntrada !== '00:00' && hoyResumen.horaSalida === '00:00') return 'SALIDA';
        if (hoyResumen.horaEntrada === '00:00') return 'ENTRADA';
        return 'NONE';
    }, [hoyResumen]);

    async function marcar(tipo: 'ENTRADA' | 'SALIDA') {
        if (!token) {
            setError('No hay token de sesión. Inicia sesión nuevamente.');
            return;
        }

        setLoadingAccion(tipo);
        setError(null);

        try {
            await api.marcarAsistencia(token, tipo);
            await refreshAll();
        } catch (e: any) {
            setError(e?.message ?? 'Error al registrar asistencia.');
        } finally {
            setLoadingAccion(null);
        }
    }

    const permisosPendientesUsuario = useMemo(
        () => misPermisos.filter((p) => p.estado === 'PENDIENTE'),
        [misPermisos],
    );

    const permisosAprobadosUsuario = useMemo(
        () => misPermisos.filter((p) => p.estado === 'APROBADO'),
        [misPermisos],
    );

    const mesCompleto = useMemo(() => {
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

            if (existing) rows.push(existing);
            else {
                const weekend = isWeekendISO(iso);
                rows.push({
                    fecha: iso,
                    horaEntrada: '00:00',
                    horaSalida: '00:00',
                    minutosTrabajados: 0,
                    minutosObjetivo: 0,
                    estado: weekend ? 'FDS' : 'SIN_REGISTRO',
                });
            }
        }
        return rows;
    }, [resumenDiario]);

    const horasSemana = useMemo(() => {
        if (!resumenDiario.length) return 0;

        const hoy = new Date();
        const inicioSemana = new Date(hoy);
        const dia = inicioSemana.getDay(); // 0=domingo
        const diff = (dia + 6) % 7; // lunes
        inicioSemana.setDate(inicioSemana.getDate() - diff);
        inicioSemana.setHours(0, 0, 0, 0);

        const inicioKey = toISODate(inicioSemana);

        const minutos = resumenDiario
            .filter((d) => d.fecha >= inicioKey)
            .reduce((acc, d) => acc + d.minutosTrabajados, 0);

        return Math.round((minutos / 60) * 10) / 10;
    }, [resumenDiario]);

    const resumenUsuarios = useMemo(() => {
        const total = usuarios.length;
        const activos = usuarios.filter((u) => u.estado === 'ACTIVO').length;
        const porRol = { ADMIN: 0, RRHH: 0, FUNCIONARIO: 0 } as Record<Rol, number>;
        for (const u of usuarios) porRol[u.id_rol] = (porRol[u.id_rol] ?? 0) + 1;
        return { total, activos, porRol };
    }, [usuarios]);

    return {
        esGestor,
        error,
        setError,
        loadingGlobal,
        loadingAccion,
        quickAction,
        marcar,
        horasSemana,
        permisosPendientesUsuario,
        permisosAprobadosUsuario,
        misPermisos,
        permisosPendientes,
        resumenUsuarios,
        mesCompleto,
    };
}