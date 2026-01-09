'use client';

import { useCallback, useState } from 'react';
import type { CrearUsuarioConJornadaPayload } from '../lib/types';
import { api } from '../lib/api';

export function useCreateUserAdmin(token: string | null, onAfter?: () => void) {
    const [open, setOpen] = useState(false);
    const [loadingCreate, setLoadingCreate] = useState(false);
    const [errorCreate, setErrorCreate] = useState<string | null>(null);

    const openCreate = useCallback(() => {
        setErrorCreate(null);
        setOpen(true);
    }, []);

    const closeCreate = useCallback(() => {
        if (loadingCreate) return;
        setOpen(false);
    }, [loadingCreate]);

    const crearUsuario = useCallback(
        async (payload: CrearUsuarioConJornadaPayload) => {
            if (!token) return;

            setLoadingCreate(true);
            setErrorCreate(null);

            try {
                await api.crearUsuarioConJornada(token, payload);
                setOpen(false);
                onAfter?.();
            } catch (e: unknown) {
                setErrorCreate(e instanceof Error ? e.message : 'Error al crear usuario');
                throw e; // para que el dialog no se cierre si falló
            } finally {
                setLoadingCreate(false);
            }
        },
        [token, onAfter],
    );

    return {
        open,
        loadingCreate,
        errorCreate,
        setErrorCreate,
        openCreate,
        closeCreate,
        crearUsuario,
    };
}