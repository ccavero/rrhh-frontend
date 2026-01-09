// src/components/usuarios/drawer/tabs/PermisosTab.tsx
'use client';

import { Box, Button, Card, CardContent, Chip, Typography } from '@mui/material';
import type { Permiso, ResolverPermisoPayload } from '../../../../lib/types';

export function PermisosTab(props: {
    permisosPendientesUsuario: Permiso[];
    loadingAccion: boolean;
    onResolverPermiso: (id_permiso: string, payload: ResolverPermisoPayload) => Promise<void>;
}) {
    const { permisosPendientesUsuario, loadingAccion, onResolverPermiso } = props;

    async function aprobar(id_permiso: string) {
        await onResolverPermiso(id_permiso, { estado: 'APROBADO', con_goce: true });
    }

    async function rechazar(id_permiso: string) {
        await onResolverPermiso(id_permiso, { estado: 'RECHAZADO' });
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Permisos pendientes del usuario
                </Typography>

                {permisosPendientesUsuario.length === 0 ? (
                    <Typography color="text.secondary">No tiene permisos pendientes.</Typography>
                ) : (
                    <Box display="grid" gap={1}>
                        {permisosPendientesUsuario.map((p) => (
                            <Box
                                key={p.id_permiso}
                                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                                    <Box>
                                        <Typography><b>{p.tipo}</b></Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {p.fecha_inicio} — {p.fecha_fin}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                            {p.motivo}
                                        </Typography>
                                    </Box>
                                    <Chip label={p.estado} color="warning" />
                                </Box>

                                <Box mt={2} display="flex" gap={2} justifyContent="flex-end" flexWrap="wrap">
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        disabled={loadingAccion}
                                        onClick={() => rechazar(p.id_permiso)}
                                    >
                                        Rechazar
                                    </Button>
                                    <Button
                                        variant="contained"
                                        disabled={loadingAccion}
                                        onClick={() => aprobar(p.id_permiso)}
                                    >
                                        Aprobar
                                    </Button>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}