// src/hooks/useEditUserAdmin.ts
'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ActualizarUsuarioPayload, Usuario } from '../lib/types';
import { api } from '../lib/api';

export function useEditUserAdmin(token: string | null, onAfterChange?: () => void) {
    const [open, setOpen] = useState(false);
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    const [loadingEdit, setLoadingEdit] = useState(false);
    const [errorEdit, setErrorEdit] = useState<string | null>(null);

    const openEdit = useCallback((u: Usuario) => {
        setUsuario(u);
        setErrorEdit(null);
        setOpen(true);
    }, []);

    const closeEdit = useCallback(() => {
        setOpen(false);
        setUsuario(null);
        setErrorEdit(null);
        setLoadingEdit(false);
    }, []);

    const submitEdit = useCallback(
        async (payload: ActualizarUsuarioPayload) => {
            if (!token || !usuario?.id_usuario) return;

            setLoadingEdit(true);
            setErrorEdit(null);

            try {
                // Limpieza: no mandar strings vacíos
                const cleaned: ActualizarUsuarioPayload = Object.fromEntries(
                    Object.entries(payload).filter(([, v]) => v !== undefined && v !== null && v !== ''),
                ) as ActualizarUsuarioPayload;

                await api.actualizarUsuario(token, usuario.id_usuario, cleaned);

                onAfterChange?.();
                closeEdit();
            } catch (e: unknown) {
                setErrorEdit(e instanceof Error ? e.message : 'Error al actualizar usuario');
            } finally {
                setLoadingEdit(false);
            }
        },
        [token, usuario?.id_usuario, onAfterChange, closeEdit],
    );

    return useMemo(
        () => ({
            open,
            usuario,
            loadingEdit,
            errorEdit,
            setErrorEdit,

            openEdit,
            closeEdit,
            submitEdit,
        }),
        [open, usuario, loadingEdit, errorEdit, openEdit, closeEdit, submitEdit],
    );
}