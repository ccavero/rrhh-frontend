// src/app/dashboard/page.tsx
'use client';

import { Alert, Box, Card, CardContent, Grid, Toolbar, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Sidebar, { SIDEBAR_WIDTH, Rol } from '../../components/Sidebar';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { QuickAttendanceCard } from '../../components/dashboard/QuickAttendanceCard';
import { MonthHoursCard } from '../../components/dashboard/MonthHoursCard';
import { MyPermitsCard } from '../../components/dashboard/MyPermitsCard';
import { AdminCards } from '../../components/dashboard/AdminCards';

import { clearAuthStorage, getAuthFromStorage } from '../../lib/auth-storage';
import { useDashboardData } from '../../hooks/useDashboardData';

export default function DashboardPage() {
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

    const {
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
    } = useDashboardData(token, usuarioRol);

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

                    // ✅ espacio del sidebar sin que el contenido se desborde
                    ml: `${SIDEBAR_WIDTH}px`,
                    width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
                    overflowX: 'hidden',
                }}
            >
                <Toolbar />

                <Typography variant="h5" gutterBottom>
                    Dashboard
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* ==================== FILA 1 (3 tarjetas) ==================== */}
                <Grid container spacing={6}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Horas trabajadas (semana)
                                </Typography>
                                <Box display="flex" alignItems="center" mt={1} gap={1}>
                                    <AccessTimeIcon color="primary" />
                                    <Typography variant="h4">{horasSemana}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        horas
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Mis permisos pendientes
                                </Typography>
                                <Box display="flex" alignItems="center" mt={1} gap={1}>
                                    <AssignmentIcon color="warning" />
                                    <Typography variant="h4">{permisosPendientesUsuario.length}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Mis permisos aprobados
                                </Typography>
                                <Box display="flex" alignItems="center" mt={1} gap={1}>
                                    <AssignmentIcon color="success" />
                                    <Typography variant="h4">{permisosAprobadosUsuario.length}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* ==================== (OPCIONAL) FILA GESTOR ==================== */}
                {esGestor && (
                    <Grid container spacing={6} sx={{ mt: 3 }}>
                        <Grid size={9.1}>
                            {/* usa el MISMO ancho que estás usando para Quick/MyPermits/MonthHours */}
                            <Grid item xs={12} md={12}>
                                <AdminCards
                                    resumenUsuarios={resumenUsuarios}
                                    permisosPendientesCount={permisosPendientes.length}
                                    loadingGlobal={loadingGlobal}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                )}

                {/* ==================== FILA 2 (ancho alineado, no full) ==================== */}
                <Grid container spacing={3} sx={{ mt: 3 }}>
                    <Grid size={9}>
                        <Grid item xs={12}>
                            <QuickAttendanceCard
                                quickAction={quickAction}
                                loading={loadingAccion}
                                onMarkEntrada={() => void marcar('ENTRADA')}
                                onMarkSalida={() => void marcar('SALIDA')}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* ==================== FILA 3 (ancho alineado, no full) ==================== */}
                <Grid container spacing={3} sx={{ mt: 3 }}>
                    <Grid size={9}>
                        <Grid item xs={12}>
                            <MyPermitsCard permisos={misPermisos} />
                        </Grid>
                    </Grid>
                </Grid>

                {/* ==================== FILA 4 (ancho alineado, no full) ==================== */}
                <Grid container spacing={3} sx={{ mt: 3 }}>
                    <Grid size={9}>
                        <Grid item xs={12}>
                            <MonthHoursCard rows={mesCompleto} />
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}