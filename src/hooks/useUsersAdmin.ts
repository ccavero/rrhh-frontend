// src/hooks/useUsersAdmin.ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Permiso, Usuario } from '../lib/types';
import { api } from '../lib/api';

type Rol = 'ADMIN' | 'RRHH' | 'FUNCIONARIO';
type Estado = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | string;

export function useUsersAdmin(token: string | null) {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [permisosPendientes, setPermisosPendientes] = useState<Permiso[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState('');
    const [rol, setRol] = useState<Rol | 'ALL'>('ALL');
    const [estado, setEstado] = useState<Estado | 'ALL'>('ALL');

    const fetchAll = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        setError(null);

        try {
            const [users, pending] = await Promise.all([api.usuarios(token), api.permisosPendientes(token)]);
            setUsuarios(users);
            setPermisosPendientes(pending);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        void fetchAll();
    }, [fetchAll]);

    const pendingByUserId = useMemo(() => {
        const set = new Set<string>();
        for (const p of permisosPendientes) {
            if (p.estado === 'PENDIENTE' && p.id_solicitante) set.add(p.id_solicitante);
        }
        return set;
    }, [permisosPendientes]);

    const usuariosFiltrados = useMemo(() => {
        const q = query.trim().toLowerCase();

        return usuarios.filter((u) => {
            const matchQuery =
                !q ||
                `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q);

            const matchRol = rol === 'ALL' ? true : u.id_rol === rol;
            const matchEstado = estado === 'ALL' ? true : u.estado === estado;

            return matchQuery && matchRol && matchEstado;
        });
    }, [usuarios, query, rol, estado]);

    return {
        usuarios: usuariosFiltrados,
        usuariosRaw: usuarios,
        permisosPendientes,
        pendingByUserId,

        loading,
        error,
        setError,

        query,
        setQuery,
        rol,
        setRol,
        estado,
        setEstado,

        refresh: fetchAll,
    };
}