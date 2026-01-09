// src/components/dashboard/AdminCards.tsx
'use client';

import {
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Typography,
    Box,
    Chip,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';

type Rol = 'ADMIN' | 'RRHH' | 'FUNCIONARIO';

export function AdminCards(props: {
    resumenUsuarios: {
        total: number;
        activos: number;
        porRol: Record<Rol, number>;
    };
    permisosPendientesCount: number;
    loadingGlobal: boolean;
}) {
    const { resumenUsuarios, permisosPendientesCount, loadingGlobal } = props;

    return (
        <Grid
            container
            rowSpacing={3}
            columnSpacing={{ xs: 2, sm: 3, md: 4 }}
            alignItems="stretch"
        >
            {/* Card 1: Usuarios (8/12) */}
            <Grid size={{ xs: 12, md: 8 }} display="flex">
                <Card sx={{ width: '100%', height: '100%' }}>
                    <CardContent sx={{ height: '100%' }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            Usuarios registrados
                        </Typography>

                        <Box display="flex" alignItems="center" gap={2}>
                            <PeopleIcon color="primary" />
                            <Box>
                                <Typography variant="h4">{resumenUsuarios.total}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {resumenUsuarios.activos} activos
                                </Typography>
                            </Box>
                        </Box>

                        <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                            <Chip size="small" label={`ADMIN: ${resumenUsuarios.porRol.ADMIN}`} />
                            <Chip size="small" label={`RRHH: ${resumenUsuarios.porRol.RRHH}`} />
                            <Chip size="small" label={`FUNC.: ${resumenUsuarios.porRol.FUNCIONARIO}`} />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Card 2: Pendientes (4/12) */}
            <Grid size={{ xs: 12, md: 4 }} display="flex">
                <Card sx={{ width: '100%', height: '100%' }}>
                    <CardContent
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center', // ✅ centra verticalmente
                            gap: 1,
                        }}
                    >
                        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                            <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                sx={{
                                    whiteSpace: 'nowrap',     // ✅ evita que el título se parta
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis', // ✅ si no entra, pone ...
                                    maxWidth: '100%',
                                }}
                                title="Permisos pendientes a revisar"
                            >
                                Permisos pendientes
                            </Typography>

                            {loadingGlobal && <CircularProgress size={18} />}
                        </Box>

                        <Box display="flex" alignItems="center" gap={2} mt={1}>
                            <AssignmentIcon color="error" />
                            <Box>
                                <Typography variant="h4">{permisosPendientesCount}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Solicitudes pendientes
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}