// src/hooks/useUserDetailAdmin.ts
'use client';

import { useCallback, useMemo, useState } from 'react';
import type {
    Asistencia,
    AsistenciaResumenDiario,
    Permiso,
    ResolverPermisoPayload,
    Usuario,
    JornadaSemanal,
} from '../lib/types';
import { api } from '../lib/api';

// rango simple: mes actual
function monthRange() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const f = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
    const t = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`;
    return { from: f, to: t };
}

export function useUserDetailAdmin(
    token: string | null,
    // opcional: callback para refrescar lista/pendientes en la tabla principal
    onAfterChange?: () => void,
) {
    const [open, setOpen] = useState(false);
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    const [jornada, setJornada] = useState<JornadaSemanal | null>(null);
    const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
    const [resumen, setResumen] = useState<AsistenciaResumenDiario[]>([]);
    const [permisosPendientesUsuario, setPermisosPendientesUsuario] = useState<Permiso[]>([]);

    const [loading, setLoading] = useState(false);
    const [loadingAccion, setLoadingAccion] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { from, to } = useMemo(() => monthRange(), []);

    const onClearError = useCallback(() => setError(null), []);

    const close = useCallback(() => {
        setOpen(false);
        setUsuario(null);
        setJornada(null);
        setAsistencias([]);
        setResumen([]);
        setPermisosPendientesUsuario([]);
        setError(null);
        setLoading(false);
        setLoadingAccion(false);
    }, []);

    const load = useCallback(
        async (id_usuario: string) => {
            if (!token) return;

            setLoading(true);
            setError(null);

            try {
                const [u, j, a, r, pendientes] = await Promise.all([
                    api.usuarioPorId(token, id_usuario),
                    api.jornadaDeUsuario(token, id_usuario),
                    api.asistenciasDeUsuario(token, id_usuario),
                    api.resumenDiarioDeUsuario(token, id_usuario, from, to),
                    api.permisosPendientes(token),
                ]);

                setUsuario(u);
                setJornada(j as any); // tu api devuelve JornadaSemanal equivalente
                setAsistencias(a);
                setResumen(r);

                const pendientesDeEste = (pendientes ?? []).filter(
                    (p: Permiso) => p.estado === 'PENDIENTE' && p.id_solicitante === id_usuario,
                );
                setPermisosPendientesUsuario(pendientesDeEste);
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Error al cargar detalle del usuario');
            } finally {
                setLoading(false);
            }
        },
        [token, from, to],
    );

    const openForUser = useCallback(
        async (u: Usuario) => {
            setOpen(true);
            setUsuario(u); // muestra overview rápido mientras carga el resto
            await load(u.id_usuario);
        },
        [load],
    );

    const refresh = useCallback(async () => {
        if (!token || !usuario?.id_usuario) return;
        await load(usuario.id_usuario);
    }, [token, usuario?.id_usuario, load]);

    // ===========================
    // ACCIONES: PERMISOS
    // ===========================
    const resolverPermiso = useCallback(
        async (id_permiso: string, payload: ResolverPermisoPayload) => {
            if (!token) return;
            setLoadingAccion(true);
            setError(null);

            try {
                await api.resolverPermiso(token, id_permiso, payload);
                await refresh();
                onAfterChange?.();
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Error al resolver permiso');
            } finally {
                setLoadingAccion(false);
            }
        },
        [token, refresh, onAfterChange],
    );

    // ===========================
    // ✅ ACCIONES: ASISTENCIAS (RRHH/ADMIN)
    // ===========================
    const crearAsistenciaManual = useCallback(
        async (payload: {
            id_usuario: string;
            tipo: 'ENTRADA' | 'SALIDA';
            fecha_hora: string; // ISO
            observacion?: string;
        }) => {
            if (!token) return;

            setLoadingAccion(true);
            setError(null);

            try {
                await api.crearAsistenciaManual(token, {
                    ...payload,
                    origen: 'manual', // opcional, por si tu backend lo usa
                } as any);
                await refresh();
                onAfterChange?.();
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Error al crear asistencia manual');
            } finally {
                setLoadingAccion(false);
            }
        },
        [token, refresh, onAfterChange],
    );

    const anularAsistencia = useCallback(
        async (id_asistencia: string, payload?: { observacion?: string }) => {
            if (!token) return;

            setLoadingAccion(true);
            setError(null);

            try {
                await api.anularAsistencia(token, id_asistencia, payload);
                await refresh();
                onAfterChange?.();
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Error al anular asistencia');
            } finally {
                setLoadingAccion(false);
            }
        },
        [token, refresh, onAfterChange],
    );

    const actualizarJornada = useCallback(
        async (payload: JornadaSemanal) => {
            if (!token || !usuario?.id_usuario) return;

            setLoadingAccion(true);
            setError(null);

            try {
                await api.setJornadaDeUsuario(token, usuario.id_usuario, payload);
                await refresh();
                onAfterChange?.();
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Error al actualizar jornada');
            } finally {
                setLoadingAccion(false);
            }
        },
        [token, usuario?.id_usuario, refresh, onAfterChange],
    );

    return {
        // state
        open,
        usuario,
        jornada,
        asistencias,
        resumen,
        permisosPendientesUsuario,
        loading,
        loadingAccion,
        error,

        // actions
        openForUser,
        close,
        refresh,
        setError,
        onClearError,

        // permisos
        resolverPermiso,

        // ✅ asistencias
        crearAsistenciaManual,
        anularAsistencia,

        actualizarJornada,
    };
}