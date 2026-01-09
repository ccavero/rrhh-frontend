// src/components/usuarios/drawer/tabs/OverviewTab.tsx
'use client';

import { Alert, Box, Card, CardContent, Typography } from '@mui/material';
import type { Permiso, Usuario } from '../../../../lib/types';

export function OverviewTab(props: {
    usuario: Usuario | null;
    permisosPendientesUsuario: Permiso[];
}) {
    const { usuario, permisosPendientesUsuario } = props;

    return (
        <Card>
            <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                    Perfil
                </Typography>

                {usuario ? (
                    <Box mt={1} display="grid" gap={1}>
                        <Typography><b>Nombre:</b> {usuario.nombre} {usuario.apellido}</Typography>
                        <Typography><b>Email:</b> {usuario.email}</Typography>
                        <Typography><b>Rol:</b> {usuario.id_rol}</Typography>
                        <Typography><b>Estado:</b> {usuario.estado}</Typography>

                        {permisosPendientesUsuario.length > 0 && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                Este usuario tiene {permisosPendientesUsuario.length} permiso(s) pendiente(s).
                            </Alert>
                        )}
                    </Box>
                ) : (
                    <Typography color="text.secondary">No hay usuario seleccionado.</Typography>
                )}
            </CardContent>
        </Card>
    );
}