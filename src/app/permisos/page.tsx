// src/app/permisos/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Alert, Box, Toolbar, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import Sidebar, { SIDEBAR_WIDTH, Rol } from '../../components/Sidebar';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { clearAuthStorage, getAuthFromStorage } from '../../lib/auth-storage';

import { useMyPermits } from '../../hooks/useMyPermits';
import { MyPermitsSummary } from '../../components/permisos/MyPermitsSummary';
import { PermitRequestCard } from '../../components/permisos/PermitRequestCard';
import { MyPermitsTableCard } from '../../components/permisos/MyPermitsTableCard';

export default function PermisosPage() {
    const router = useRouter();

    const [token, setToken] = useState<string | null>(null);
    const [usuarioNombre, setUsuarioNombre] = useState('Usuario');
    const [usuarioRol, setUsuarioRol] = useState<Rol>('FUNCIONARIO');

    useEffect(() => {
        const auth = getAuthFromStorage();
        if (!auth.token) {
            router.push('/');
            return;
        }
        setToken(auth.token);
        setUsuarioNombre(auth.usuarioNombre);
        setUsuarioRol(auth.usuarioRol);
    }, [router]);

    const { permisos, pendientes, aprobados, submitting, error, setError, solicitar } =
        useMyPermits(token);

    function handleLogout() {
        clearAuthStorage();
        router.push('/');
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <DashboardHeader />
            <Sidebar usuarioNombre={usuarioNombre} usuarioRol={usuarioRol} onLogout={handleLogout} />

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
                    Permisos
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={6} sx={{ mt: 3 }}>
                    {/* Fila 1: resumen */}
                    <Grid item xs={12} >
                        <Grid size={20}>
                            <MyPermitsSummary pendientes={pendientes.length} aprobados={aprobados.length} />
                        </Grid>
                    </Grid>

                    {/* Fila 2: solicitar */}
                    <Grid item xs={12} >
                        <Grid size={9.9}>
                           <PermitRequestCard submitting={submitting} onSubmit={solicitar} />
                        </Grid>
                    </Grid>

                    {/* Fila 3: tabla */}
                    <Grid item xs={12}>
                        <Grid size={18.5}>
                          <MyPermitsTableCard permisos={permisos} />
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}