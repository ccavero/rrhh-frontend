// src/components/usuarios/drawer/UserDetailDrawer.tsx
'use client';

import { useState } from 'react';
import {
    Alert,
    Box,
    Divider,
    Drawer,
    IconButton,
    Tab,
    Tabs,
    Toolbar,
    Typography,
    CircularProgress,
    Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import type { TabKey, UserDetailDrawerProps } from './types';
import { OverviewTab } from './tabs/OverviewTab';
import { JornadaTab } from './tabs/JornadaTab';
import { AsistenciasTab } from './tabs/AsistenciasTab';
import { PermisosTab } from './tabs/PermisosTab';

export function UserDetailDrawer(props: UserDetailDrawerProps) {
    const {
        open,
        onClose,
        loading,
        loadingAccion = false,
        error,
        onClearError,
        usuario,
        jornada,
        asistencias,
        resumen,
        permisosPendientesUsuario,
        onResolverPermiso,

        // ✅ nuevo
        onCrearAsistenciaManual,
        onAnularAsistencia,
    } = props;

    const [tab, setTab] = useState<TabKey>('overview');

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 520, md: 720 },
                    maxWidth: '100%',
                },
            }}
        >
            <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Detalle de usuario
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Toolbar>

            <Divider />

            <Box sx={{ px: 2, pt: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={onClearError}>
                        {error}
                    </Alert>
                )}

                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="scrollable"
                    allowScrollButtonsMobile
                    sx={{ mb: 2 }}
                >
                    <Tab value="overview" label="Overview" />
                    <Tab value="jornada" label="Jornada" />
                    <Tab value="asistencias" label="Asistencias" />
                    <Tab
                        value="permisos"
                        label={
                            permisosPendientesUsuario.length > 0 ? (
                                <Box display="flex" alignItems="center" gap={1}>
                                    Permisos{' '}
                                    <Chip size="small" color="warning" label={permisosPendientesUsuario.length} />
                                </Box>
                            ) : (
                                'Permisos'
                            )
                        }
                    />
                </Tabs>

                {loading && (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                    </Box>
                )}

                {!loading && tab === 'overview' && (
                    <OverviewTab usuario={usuario} permisosPendientesUsuario={permisosPendientesUsuario} />
                )}

                {!loading && tab === 'jornada' &&
                    <JornadaTab
                    jornada={jornada}
                    loadingAccion={loadingAccion}
                    onSaveJornada={props.onSaveJornada}
                    />
                }

                {!loading && tab === 'asistencias' && (
                    <AsistenciasTab
                        usuarioId={usuario?.id_usuario ?? null}
                        resumen={resumen}
                        asistencias={asistencias}
                        loadingAccion={loadingAccion}
                        onCrearAsistenciaManual={onCrearAsistenciaManual}
                        onAnularAsistencia={onAnularAsistencia}
                    />
                )}

                {!loading && tab === 'permisos' && (
                    <PermisosTab
                        permisosPendientesUsuario={permisosPendientesUsuario}
                        loadingAccion={loadingAccion}
                        onResolverPermiso={onResolverPermiso}
                    />
                )}
            </Box>
        </Drawer>
    );
}