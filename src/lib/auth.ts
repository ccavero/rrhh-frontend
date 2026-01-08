// src/lib/auth.ts
export type Rol = 'ADMIN' | 'RRHH' | 'FUNCIONARIO';

export type UsuarioSesion = {
    id_usuario: string;
    nombre: string;
    apellido: string;
    email: string;
    id_rol: Rol;
    estado: string;
};

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('token');
}

export function getUsuarioSesion(): UsuarioSesion | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem('usuario');
    if (!raw) return null;
    try {
        return JSON.parse(raw) as UsuarioSesion;
    } catch {
        return null;
    }
}

export function isGestorRol(rol: Rol | undefined | null): boolean {
    return rol === 'ADMIN' || rol === 'RRHH';
}

export function logoutLocal() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('usuario');
}