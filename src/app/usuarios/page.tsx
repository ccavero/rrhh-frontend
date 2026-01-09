// src/app/usuarios/page.tsx
'use client';

import { Alert, Box, Toolbar, Typography, Button } from '@mui/material';
import Grid from '@mui/material/Grid';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import Sidebar, { SIDEBAR_WIDTH, Rol } from '../../components/Sidebar';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { clearAuthStorage, getAuthFromStorage } from '../../lib/auth-storage';

import { useUsersAdmin } from '../../hooks/useUsersAdmin';
import { useUserDetailAdmin } from '../../hooks/useUserDetailAdmin';
import { useCreateUserAdmin } from '../../hooks/useCreateUserAdmin';
import { useEditUserAdmin } from '../../hooks/useEditUserAdmin';

import { UsersTable } from '../../components/usuarios/UsersTable';
import { UserDetailDrawer } from '../../components/usuarios/drawer/UserDetailDrawer';
import { CreateUserDialog } from '../../components/usuarios/CreateUserDialog';
import { EditUserDialog } from '../../components/usuarios/EditUserDialog';

import type { Usuario } from '../../lib/types';

export default function UsuariosPage() {
    const router = useRouter();

    const [authReady, setAuthReady] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [usuarioNombre, setUsuarioNombre] = useState('Usuario');
    const [usuarioRol, setUsuarioRol] = useState<Rol | null>(null);

    useEffect(() => {
        const auth = getAuthFromStorage();
        if (!auth.token) {
            router.push('/');
            return;
        }
        setToken(auth.token);
        setUsuarioNombre(auth.usuarioNombre);
        setUsuarioRol(auth.usuarioRol);
        setAuthReady(true);
    }, [router]);

    const esGestor = useMemo(() => {
        if (!usuarioRol) return false;
        return usuarioRol === 'ADMIN' || usuarioRol === 'RRHH';
    }, [usuarioRol]);

    useEffect(() => {
        if (!authReady) return;
        if (!esGestor) router.push('/dashboard');
    }, [authReady, esGestor, router]);

    const {
        usuarios,
        loading,
        error,
        setError,
        query,
        setQuery,
        rol,
        setRol,
        estado,
        setEstado,
        pendingByUserId,
        refresh,
    } = useUsersAdmin(token);

    const detail = useUserDetailAdmin(token, refresh);

    // ✅ Crear usuario
    const create = useCreateUserAdmin(token, refresh);

    // ✅ Editar usuario (refresca tabla y, si el drawer está abierto, lo refresca también)
    const edit = useEditUserAdmin(token, () => {
        refresh();
        void detail.refresh();
    });

    function handleLogout() {
        clearAuthStorage();
        router.push('/');
    }

    const onOpenDetail = useCallback(
        (u: Usuario) => {
            void detail.openForUser(u);
        },
        [detail],
    );

    const onOpenEdit = useCallback(
        (u: Usuario) => {
            edit.openEdit(u);
        },
        [edit],
    );

    if (!authReady) return null;

    return (
        <Box sx={{ display: 'flex' }}>
            <DashboardHeader />

            <Sidebar
                usuarioNombre={usuarioNombre}
                usuarioRol={(usuarioRol ?? 'FUNCIONARIO') as Rol}
                onLogout={handleLogout}
            />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    p: 3,
                    ml: `${SIDEBAR_WIDTH}px`,
                }}
            >
                <Toolbar />
                <Typography variant="h5" gutterBottom>
                    Usuarios (RRHH/ADMIN)
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={6}>
                    <Grid item xs={12}>
                        <Box mb={2} display="flex" justifyContent="flex-end" gap={2}>
                            <Button variant="contained" onClick={create.openCreate}>
                                Crear usuario
                            </Button>
                        </Box>

                        <UsersTable
                            usuarios={usuarios}
                            query={query}
                            setQuery={setQuery}
                            rol={rol}
                            setRol={setRol}
                            estado={estado}
                            setEstado={setEstado}
                            pendingByUserId={pendingByUserId}
                            onOpenDetail={onOpenDetail}
                            onOpenEdit={onOpenEdit}
                            loading={loading}
                        />
                    </Grid>
                </Grid>
            </Box>

            <UserDetailDrawer
                open={detail.open}
                onClose={detail.close}
                loading={detail.loading}
                loadingAccion={detail.loadingAccion}
                error={detail.error}
                onClearError={() => detail.setError(null)}
                usuario={detail.usuario}
                jornada={detail.jornada}
                asistencias={detail.asistencias}
                resumen={detail.resumen}
                permisosPendientesUsuario={detail.permisosPendientesUsuario}
                onResolverPermiso={detail.resolverPermiso}
                onCrearAsistenciaManual={detail.crearAsistenciaManual}
                onAnularAsistencia={detail.anularAsistencia}
                onSaveJornada={detail.actualizarJornada}
            />

            <CreateUserDialog
                open={create.open}
                onClose={create.closeCreate}
                loading={create.loadingCreate}
                error={create.errorCreate}
                onSubmit={create.crearUsuario}
            />

            <EditUserDialog
                open={edit.open}
                onClose={edit.closeEdit}
                loading={edit.loadingEdit}
                error={edit.errorEdit}
                usuario={edit.usuario}
                onSubmit={edit.submitEdit}
            />
        </Box>
    );
}