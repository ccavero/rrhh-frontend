// src/components/usuarios/UsersTable.tsx
'use client';

import {
    Box,
    Card,
    CardContent,
    Grid,
    IconButton,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { Usuario } from '../../lib/types';

export function UsersTable(props: {
    usuarios: Usuario[];
    query: string;
    setQuery: (v: string) => void;
    rol: 'ALL' | Usuario['id_rol'];
    setRol: (v: any) => void;
    estado: 'ALL' | 'ACTIVO' | 'INACTIVO';
    setEstado: (v: any) => void;

    pendingByUserId: Set<string>;

    onOpenDetail: (u: Usuario) => void;
    onOpenEdit: (u: Usuario) => void;

    loading?: boolean;
}) {
    const {
        usuarios,
        query,
        setQuery,
        rol,
        setRol,
        estado,
        setEstado,
        pendingByUserId,
        onOpenDetail,
        onOpenEdit,
        loading = false,
    } = props;

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Usuarios
                </Typography>

                <Grid container rowSpacing={2} columnSpacing={{ xs: 2, md: 3 }} alignItems="center" mb={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Buscar"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Nombre, apellido o email..."
                        />
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Select fullWidth value={rol} onChange={(e) => setRol(e.target.value)}>
                            <MenuItem value="ALL">Todos los roles</MenuItem>
                            <MenuItem value="ADMIN">ADMIN</MenuItem>
                            <MenuItem value="RRHH">RRHH</MenuItem>
                            <MenuItem value="FUNCIONARIO">FUNCIONARIO</MenuItem>
                        </Select>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Select fullWidth value={estado} onChange={(e) => setEstado(e.target.value)}>
                            <MenuItem value="ALL">Todos</MenuItem>
                            <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                            <MenuItem value="INACTIVO">INACTIVO</MenuItem>
                        </Select>
                    </Grid>
                </Grid>

                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Rol</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {usuarios.map((u) => {
                            const tienePendiente = pendingByUserId.has(u.id_usuario);

                            return (
                                <TableRow key={u.id_usuario} hover>
                                    <TableCell>{u.nombre} {u.apellido}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>
                                        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                                            <Chip size="small" label={u.id_rol} />
                                            {tienePendiente && (
                                                <Chip size="small" color="warning" label="PERMISO PEND." />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={u.estado}
                                            color={u.estado === 'ACTIVO' ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => onOpenDetail(u)} size="small" disabled={loading}>
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton onClick={() => onOpenEdit(u)} size="small" disabled={loading}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {usuarios.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5}>
                                    <Box py={2}>
                                        <Typography variant="body2" color="text.secondary">
                                            No hay usuarios con esos filtros.
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}