'use client';

import { Alert, Box, Button, Card, CardContent, Toolbar, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import PrintIcon from '@mui/icons-material/Print';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Sidebar, { SIDEBAR_WIDTH, Rol } from '../../components/Sidebar';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { MonthHoursCard } from '../../components/dashboard/MonthHoursCard';

import { clearAuthStorage, getAuthFromStorage } from '../../lib/auth-storage';
import { useMyAttendancePage } from '../../hooks/useMyAttendancePage';

import { printAttendanceReport } from '../../lib/print-attendance-report';
import { exportAttendancePdf } from '../../lib/export-attendance-pdf';

export default function MisAsistenciasPage() {
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

    const { error, setError, rowsMesCompleto, loading } = useMyAttendancePage(token);

    function handleLogout() {
        clearAuthStorage();
        router.push('/');
    }

    const disabled = loading || rowsMesCompleto.length === 0;

    return (
        <Box sx={{ display: 'flex' }}>
            <DashboardHeader />

            <Sidebar
                usuarioNombre={usuarioNombre}
                usuarioRol={usuarioRol}
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
                    Mis asistencias
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid size={9.1}>
                        <MonthHoursCard rows={rowsMesCompleto} />

                        <Card sx={{ mt: 3 }}>
                            <CardContent
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                }}
                            >
                                <Button
                                    variant="contained"
                                    startIcon={<PrintIcon />}
                                    onClick={() =>
                                        printAttendanceReport({
                                            usuarioNombre,
                                            rows: rowsMesCompleto,
                                        })
                                    }
                                    disabled={disabled}
                                >
                                    Imprimir
                                </Button>

                                <Button
                                    variant="outlined"
                                    sx={{ ml: 2 }}
                                    onClick={() =>
                                        exportAttendancePdf({
                                            usuarioNombre,
                                            rows: rowsMesCompleto,
                                        })
                                    }
                                    disabled={disabled}
                                >
                                    Exportar PDF
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}