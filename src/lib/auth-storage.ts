// src/lib/auth-storage.ts
import type { Rol } from '@/components/Sidebar';

export type UsuarioSesion = {
    token: string | null;
    usuarioNombre: string;
    usuarioRol: Rol;
};

export function getAuthFromStorage(): UsuarioSesion {
    if (typeof window === 'undefined') {
        return {
            token: null,
            usuarioNombre: 'Usuario',
            usuarioRol: 'FUNCIONARIO',
        };
    }

    const token = window.localStorage.getItem('token');
    const rawUser = window.localStorage.getItem('usuario');

    let usuarioNombre = 'Usuario';
    let usuarioRol: Rol = 'FUNCIONARIO';

    if (rawUser) {
        try {
            const parsed = JSON.parse(rawUser) as {
                nombre?: string;
                apellido?: string;
                id_rol?: Rol;
            };

            const nombreCompleto = `${parsed.nombre ?? ''} ${parsed.apellido ?? ''}`.trim();
            usuarioNombre = nombreCompleto || 'Usuario';
            if (parsed.id_rol) usuarioRol = parsed.id_rol;
        } catch {
            // noop
        }
    }

    return { token, usuarioNombre, usuarioRol };
}

export function isGestorRol(rol: Rol | null | undefined): boolean {
    return rol === 'ADMIN' || rol === 'RRHH';
}

export function clearAuthStorage() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('usuario');
}