'use client';

import {
    Card,
    CardContent,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import type { Permiso } from '../../lib/types';

export function MyPermitsCard(props: { permisos: Permiso[] }) {
    const { permisos } = props;

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Mis solicitudes de permiso
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Revisa el estado de tus últimas solicitudes.
                </Typography>

                {permisos.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        Aún no tienes solicitudes de permiso registradas.
                    </Typography>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Rango</TableCell>
                                <TableCell>Estado</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {permisos.slice(0, 5).map((p) => (
                                <TableRow key={p.id_permiso}>
                                    <TableCell>{p.tipo}</TableCell>
                                    <TableCell>
                                        {p.fecha_inicio} — {p.fecha_fin}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={p.estado}
                                            size="small"
                                            color={p.estado === 'APROBADO' ? 'success' : p.estado === 'PENDIENTE' ? 'warning' : 'default'}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}