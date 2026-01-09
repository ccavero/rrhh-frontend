// src/components/usuarios/EditUserDialog.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';

import type { ActualizarUsuarioPayload, Rol, Usuario, UsuarioEstado } from '../../lib/types';

export function EditUserDialog(props: {
    open: boolean;
    onClose: () => void;
    loading: boolean;
    error: string | null;

    usuario: Usuario | null;
    onSubmit: (payload: ActualizarUsuarioPayload) => Promise<void>;
}) {
    const { open, onClose, loading, error, usuario, onSubmit } = props;

    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [id_rol, setIdRol] = useState<Rol>('FUNCIONARIO');
    const [estado, setEstado] = useState<UsuarioEstado>('ACTIVO');

    const [password, setPassword] = useState(''); // opcional

    useEffect(() => {
        if (!usuario) return;
        setNombre(usuario.nombre ?? '');
        setApellido(usuario.apellido ?? '');
        setEmail(usuario.email ?? '');
        setIdRol((usuario.id_rol as Rol) ?? 'FUNCIONARIO');
        setEstado((usuario.estado as UsuarioEstado) ?? 'ACTIVO');
        setPassword('');
    }, [usuario, open]);

    const disabled = loading || !usuario;

    const payload = useMemo<ActualizarUsuarioPayload>(() => {
        // Mandamos solo lo que cambió (comparando con usuario original)
        const p: ActualizarUsuarioPayload = {};

        if (usuario) {
            if (nombre !== usuario.nombre) p.nombre = nombre;
            if (apellido !== usuario.apellido) p.apellido = apellido;
            if (email !== usuario.email) p.email = email;
            if (id_rol !== (usuario.id_rol as Rol)) p.id_rol = id_rol;
            if (estado !== (usuario.estado as UsuarioEstado)) p.estado = estado;
            if (password.trim().length > 0) p.password = password.trim();
        }

        return p;
    }, [usuario, nombre, apellido, email, id_rol, estado, password]);

    async function handleSave() {
        await onSubmit(payload);
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Editar usuario</DialogTitle>

            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!usuario ? (
                    <Typography color="text.secondary">No hay usuario seleccionado.</Typography>
                ) : (
                    <Box display="grid" gap={2} mt={1}>
                        <TextField
                            label="Nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            disabled={disabled}
                            fullWidth
                        />
                        <TextField
                            label="Apellido"
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                            disabled={disabled}
                            fullWidth
                        />
                        <TextField
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={disabled}
                            fullWidth
                        />

                        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                            <Select
                                value={id_rol}
                                onChange={(e) => setIdRol(e.target.value as Rol)}
                                disabled={disabled}
                                fullWidth
                            >
                                <MenuItem value="ADMIN">ADMIN</MenuItem>
                                <MenuItem value="RRHH">RRHH</MenuItem>
                                <MenuItem value="FUNCIONARIO">FUNCIONARIO</MenuItem>
                            </Select>

                            <Select
                                value={estado}
                                onChange={(e) => setEstado(e.target.value as UsuarioEstado)}
                                disabled={disabled}
                                fullWidth
                            >
                                <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                                <MenuItem value="INACTIVO">INACTIVO</MenuItem>
                            </Select>
                        </Box>

                        <TextField
                            label="Nueva contraseña (opcional)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={disabled}
                            fullWidth
                            type="password"
                            helperText="Deja vacío para no cambiarla"
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={disabled || Object.keys(payload).length === 0}
                >
                    Guardar cambios
                </Button>
            </DialogActions>
        </Dialog>
    );
}