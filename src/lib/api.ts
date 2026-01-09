// src/lib/api.ts
import type { Asistencia, AsistenciaResumenDiario, Permiso, Usuario } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

// ==============================
// Tipos: Jornada (según tus DTOs)
// ==============================
export type JornadaDia = {
    dia_semana: number; // 1..7
    hora_inicio: string; // "HH:mm:ss"
    hora_fin: string; // "HH:mm:ss"
    minutos_objetivo: number; // 0..1440
    activo?: boolean; // default true
    tolerancia_minutos?: number; // 0..240
};

export type SetJornadaSemanal = {
    dias: JornadaDia[];
};

// ==============================
// Helpers fetch
// ==============================
type FetchJsonOptions = RequestInit;

function buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>,
) {
    const url = new URL(`${API_BASE_URL}${path}`);
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            if (v === undefined || v === null) continue;
            url.searchParams.set(k, String(v));
        }
    }
    return url.toString();
}

async function fetchJson<T>(url: string, token: string, init?: FetchJsonOptions): Promise<T> {
    const hasBody = init?.body !== undefined && init?.body !== null;

    const res = await fetch(url, {
        ...init,
        headers: {
            ...(init?.headers ?? {}),
            Authorization: `Bearer ${token}`,
            ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        },
    });

    if (res.status === 204) return null as unknown as T;

    const contentType = res.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '');

    if (!res.ok) {
        const msg =
            (data as any)?.message ??
            (typeof data === 'string' && data.trim().length ? data : `Error HTTP ${res.status}`);
        throw new Error(Array.isArray(msg) ? msg.join(' | ') : msg);
    }

    return data as T;
}

// ==============================
// API
// ==============================
export const api = {
    // ===========================
    // Asistencia (funcionario)
    // ===========================
    misAsistencias(token: string) {
        return fetchJson<Asistencia[]>(buildUrl('/asistencia/mias'), token);
    },

    resumenDiarioMio(token: string, from: string, to: string) {
        return fetchJson<AsistenciaResumenDiario[]>(
            buildUrl('/asistencia/mias/resumen-diario', { from, to }),
            token,
        );
    },

    marcarAsistencia(token: string, tipo: 'ENTRADA' | 'SALIDA') {
        return fetchJson<unknown>(buildUrl('/asistencia'), token, {
            method: 'POST',
            body: JSON.stringify({ tipo, origen: 'web' }),
        });
    },

    // ===========================
    // Permisos (funcionario)
    // ===========================
    misPermisos(token: string) {
        return fetchJson<Permiso[]>(buildUrl('/permisos/mios'), token);
    },

    crearPermiso(
        token: string,
        payload: {
            tipo: string;
            motivo: string;
            fecha_inicio: string; // YYYY-MM-DD
            fecha_fin: string; // YYYY-MM-DD
        },
    ) {
        return fetchJson<Permiso>(buildUrl('/permisos'), token, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    // ===========================
    // Permisos (RRHH / ADMIN)
    // ===========================
    permisosPendientes(token: string) {
        return fetchJson<Permiso[]>(buildUrl('/permisos/pendientes'), token);
    },

    resolverPermiso(
        token: string,
        id_permiso: string,
        payload: {
            estado: 'APROBADO' | 'RECHAZADO';
            con_goce?: boolean;
            observacion?: string;
        },
    ) {
        return fetchJson<Permiso>(
            buildUrl(`/permisos/${encodeURIComponent(id_permiso)}`),
            token,
            { method: 'PATCH', body: JSON.stringify(payload) },
        );
    },

    // ===========================
    // Usuarios (RRHH / ADMIN)
    // ===========================
    usuarios(token: string) {
        return fetchJson<Usuario[]>(buildUrl('/usuarios'), token);
    },

    usuarioPorId(token: string, id_usuario: string) {
        return fetchJson<Usuario>(buildUrl(`/usuarios/${encodeURIComponent(id_usuario)}`), token);
    },

    crearUsuarioConJornada(
        token: string,
        payload: {
            nombre: string;
            apellido: string;
            email: string;
            password: string;
            id_rol: 'ADMIN' | 'RRHH' | 'FUNCIONARIO';
            estado?: 'ACTIVO' | 'INACTIVO';
            jornada: SetJornadaSemanal;
        },
    ) {
        return fetchJson<Usuario>(buildUrl('/usuarios'), token, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    actualizarUsuario(
        token: string,
        id_usuario: string,
        payload: Partial<{
            nombre: string;
            apellido: string;
            email: string;
            password: string;
            id_rol: 'ADMIN' | 'RRHH' | 'FUNCIONARIO';
            estado: 'ACTIVO' | 'INACTIVO';
        }>,
    ) {
        return fetchJson<Usuario>(buildUrl(`/usuarios/${encodeURIComponent(id_usuario)}`), token, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    },

    eliminarUsuario(token: string, id_usuario: string) {
        return fetchJson<unknown>(buildUrl(`/usuarios/${encodeURIComponent(id_usuario)}`), token, {
            method: 'DELETE',
        });
    },

    // ===========================
    // Perfil / Jornada (me)
    // ===========================
    miPerfil(token: string) {
        return fetchJson<Usuario>(buildUrl('/usuarios/me'), token);
    },

    miJornada(token: string) {
        return fetchJson<SetJornadaSemanal>(buildUrl('/usuarios/me/jornada'), token);
    },

    // ===========================
    // Jornada (RRHH / ADMIN)
    // ===========================
    jornadaDeUsuario(token: string, id_usuario: string) {
        return fetchJson<SetJornadaSemanal>(
            buildUrl(`/usuarios/${encodeURIComponent(id_usuario)}/jornada`),
            token,
        );
    },

    setJornadaDeUsuario(token: string, id_usuario: string, payload: SetJornadaSemanal) {
        return fetchJson<SetJornadaSemanal>(
            buildUrl(`/usuarios/${encodeURIComponent(id_usuario)}/jornada`),
            token,
            { method: 'PUT', body: JSON.stringify(payload) },
        );
    },

    // ===========================
    // Asistencia (RRHH / ADMIN)
    // ===========================
    asistenciasDeUsuario(token: string, id_usuario: string) {
        return fetchJson<Asistencia[]>(
            buildUrl(`/asistencia/usuario/${encodeURIComponent(id_usuario)}`),
            token,
        );
    },

    resumenDiarioDeUsuario(token: string, id_usuario: string, from: string, to: string) {
        return fetchJson<AsistenciaResumenDiario[]>(
            buildUrl(`/asistencia/usuario/${encodeURIComponent(id_usuario)}/resumen-diario`, { from, to }),
            token,
        );
    },

    crearAsistenciaManual(
        token: string,
        payload: {
            id_usuario: string;
            tipo: 'ENTRADA' | 'SALIDA';
            fecha_hora: string; // ISO (backend lo parsea)
            origen?: string;
            observacion?: string;
        },
    ) {
        return fetchJson<Asistencia>(buildUrl('/asistencia/manual'), token, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    anularAsistencia(token: string, id_asistencia: string, payload?: { observacion?: string }) {
        return fetchJson<Asistencia>(
            buildUrl(`/asistencia/${encodeURIComponent(id_asistencia)}/anular`),
            token,
            {
                method: 'PATCH',
                body: JSON.stringify(payload ?? {}),
            },
        );
    },
};