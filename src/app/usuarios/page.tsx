// src/app/usuarios/page.tsx
'use client';

import {
    Alert,
    AppBar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    MenuItem,
    TextField,
    Toolbar,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import Sidebar, { SIDEBAR_WIDTH } from '../../components/Sidebar';
import { apiFetch } from '../../lib/api';
import {
    getToken,
    getUsuarioSesion,
    isGestorRol,
    logoutLocal,
    Rol,
} from '../../lib/auth';

type UsuarioResponse = {
    id_usuario: string;
    nombre: string;
    apellido: string;
    email: string;
    id_rol: Rol;
    estado: string;
    creado_en: string;
    actualizado_en: string;
};

type CrearUsuarioPayload = {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    id_rol: Rol;
};

type ActualizarUsuarioPayload = Partial<{
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    id_rol: Rol;
    estado: string;
}>;

export default function UsuariosPage() {
    const router = useRouter();

    const [token, setToken] = useState<string | null>(null);
    const [usuarioNombre, setUsuarioNombre] = useState('Usuario');
    const [usuarioRol, setUsuarioRol] = useState<Rol>('FUNCIONARIO');

    const [error, setError] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);

    const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingCreate, setLoadingCreate] = useState(false);

    // Form crear
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('123456');
    const [idRol, setIdRol] = useState<Rol>('FUNCIONARIO');

    // Edit dialog
    const [openEdit, setOpenEdit] = useState(false);
    const [editUserId, setEditUserId] = useState<string | null>(null);
    const [editNombre, setEditNombre] = useState('');
    const [editApellido, setEditApellido] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState(''); // opcional
    const [editRol, setEditRol] = useState<Rol>('FUNCIONARIO');
    const [editEstado, setEditEstado] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');
    const [loadingEdit, setLoadingEdit] = useState(false);

    // Delete dialog
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
    const [deleteUserLabel, setDeleteUserLabel] = useState<string>('');
    const [loadingDelete, setLoadingDelete] = useState(false);

    useEffect(() => {
        const t = getToken();
        const u = getUsuarioSesion();

        if (!t || !u) {
            router.push('/');
            return;
        }

        if (!isGestorRol(u.id_rol)) {
            router.push('/dashboard');
            return;
        }

        setToken(t);
        setUsuarioRol(u.id_rol);
        const nombreCompleto = `${u.nombre} ${u.apellido}`.trim();
        setUsuarioNombre(nombreCompleto || 'Usuario');
    }, [router]);

    const esGestor = useMemo(() => isGestorRol(usuarioRol), [usuarioRol]);

    async function cargarUsuarios() {
        if (!token) return;
        setLoadingList(true);
        setError(null);
        try {
            const data = await apiFetch<UsuarioResponse[]>('/usuarios', { token });
            setUsuarios(data);
        } catch (e: unknown) {
            setError(
                e instanceof Error ? e.message : 'Error inesperado listando usuarios.',
            );
        } finally {
            setLoadingList(false);
        }
    }

    useEffect(() => {
        if (!token || !esGestor) return;
        void cargarUsuarios();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, esGestor]);

    async function crearUsuario() {
        if (!token) return;

        setError(null);
        setOkMsg(null);

        if (
            !nombre.trim() ||
            !apellido.trim() ||
            !email.trim() ||
            password.length < 6
        ) {
            setError('Completa todos los campos (password mínimo 6).');
            return;
        }

        setLoadingCreate(true);

        const payload: CrearUsuarioPayload = {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            email: email.trim(),
            password,
            id_rol: idRol,
        };

        try {
            await apiFetch<UsuarioResponse>('/usuarios', {
                method: 'POST',
                token,
                body: payload,
            });

            setOkMsg('Usuario creado correctamente.');
            setNombre('');
            setApellido('');
            setEmail('');
            setPassword('123456');
            setIdRol('FUNCIONARIO');

            await cargarUsuarios();
        } catch (e: unknown) {
            setError(
                e instanceof Error ? e.message : 'Error inesperado creando usuario.',
            );
        } finally {
            setLoadingCreate(false);
        }
    }

    // --------------------------
    // EDITAR
    // --------------------------
    function abrirEditar(u: UsuarioResponse) {
        setOkMsg(null);
        setError(null);

        setEditUserId(u.id_usuario);
        setEditNombre(u.nombre);
        setEditApellido(u.apellido);
        setEditEmail(u.email);
        setEditPassword(''); // opcional
        setEditRol(u.id_rol);
        setEditEstado((u.estado as 'ACTIVO' | 'INACTIVO') || 'ACTIVO');
        setOpenEdit(true);
    }

    function cerrarEditar() {
        if (loadingEdit) return;
        setOpenEdit(false);
    }

    async function guardarEdicion() {
        if (!token || !editUserId) return;

        setError(null);
        setOkMsg(null);

        // Validación mínima
        if (!editNombre.trim() || !editApellido.trim() || !editEmail.trim()) {
            setError('Nombre, apellido y email son obligatorios.');
            return;
        }
        if (editPassword && editPassword.length < 6) {
            setError('Si cambias la contraseña, mínimo 6 caracteres.');
            return;
        }

        const payload: ActualizarUsuarioPayload = {
            nombre: editNombre.trim(),
            apellido: editApellido.trim(),
            email: editEmail.trim(),
            id_rol: editRol,
            estado: editEstado,
        };
        if (editPassword) payload.password = editPassword;

        setLoadingEdit(true);
        try {
            await apiFetch<UsuarioResponse>(`/usuarios/${editUserId}`, {
                method: 'PATCH',
                token,
                body: payload,
            });

            setOkMsg('Usuario actualizado correctamente.');
            setOpenEdit(false);
            await cargarUsuarios();
        } catch (e: unknown) {
            setError(
                e instanceof Error ? e.message : 'Error inesperado actualizando usuario.',
            );
        } finally {
            setLoadingEdit(false);
        }
    }

    // --------------------------
    // ELIMINAR
    // --------------------------
    function abrirEliminar(u: UsuarioResponse) {
        setOkMsg(null);
        setError(null);

        setDeleteUserId(u.id_usuario);
        setDeleteUserLabel(`${u.nombre} ${u.apellido} (${u.email})`);
        setOpenDelete(true);
    }

    function cerrarEliminar() {
        if (loadingDelete) return;
        setOpenDelete(false);
    }

    async function confirmarEliminar() {
        if (!token || !deleteUserId) return;

        setLoadingDelete(true);
        setError(null);
        setOkMsg(null);

        try {
            await apiFetch<{ message?: string }>(`/usuarios/${deleteUserId}`, {
                method: 'DELETE',
                token,
            });

            setOkMsg('Usuario eliminado correctamente.');
            setOpenDelete(false);
            await cargarUsuarios();
        } catch (e: unknown) {
            setError(
                e instanceof Error ? e.message : 'Error inesperado eliminando usuario.',
            );
        } finally {
            setLoadingDelete(false);
        }
    }

    function handleLogout() {
        logoutLocal();
        router.push('/');
    }

    return (
        <Box sx={{ display: 'flex' }}>
            {/* AppBar superior */}
            <AppBar
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div">
                        B.T.O. – RRHH AGETIC
                    </Typography>
                </Toolbar>
            </AppBar>

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

                <Container maxWidth="lg">
                    <Typography variant="h5" gutterBottom>
                        Usuarios
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {okMsg && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {okMsg}
                        </Alert>
                    )}

                    <Grid container spacing={3}>
                        {/* CREAR */}
                        <Grid item xs={12} md={5}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Crear nuevo usuario
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        Se crea en estado ACTIVO por defecto (según tu backend).
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Nombre"
                                                fullWidth
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Apellido"
                                                fullWidth
                                                value={apellido}
                                                onChange={(e) => setApellido(e.target.value)}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <TextField
                                                label="Email"
                                                type="email"
                                                fullWidth
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <TextField
                                                label="Contraseña"
                                                type="password"
                                                fullWidth
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                helperText="Mínimo 6 caracteres."
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <TextField
                                                label="Rol"
                                                select
                                                fullWidth
                                                value={idRol}
                                                onChange={(e) => setIdRol(e.target.value as Rol)}
                                            >
                                                <MenuItem value="FUNCIONARIO">FUNCIONARIO</MenuItem>
                                                <MenuItem value="RRHH">RRHH</MenuItem>
                                                <MenuItem value="ADMIN">ADMIN</MenuItem>
                                            </TextField>
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                onClick={() => void crearUsuario()}
                                                disabled={loadingCreate}
                                            >
                                                {loadingCreate ? 'Creando...' : 'Crear usuario'}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* LISTA */}
                        <Grid item xs={12} md={7}>
                            <Card>
                                <CardContent>
                                    <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        mb={1}
                                    >
                                        <Typography variant="h6">Listado</Typography>
                                        <Button
                                            variant="outlined"
                                            onClick={() => void cargarUsuarios()}
                                            disabled={loadingList}
                                        >
                                            {loadingList ? 'Cargando...' : 'Refrescar'}
                                        </Button>
                                    </Box>

                                    <Divider sx={{ mb: 2 }} />

                                    {usuarios.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            No hay usuarios para mostrar.
                                        </Typography>
                                    ) : (
                                        <Box sx={{ overflowX: 'auto' }}>
                                            <Box
                                                component="table"
                                                sx={{
                                                    width: '100%',
                                                    borderCollapse: 'collapse',
                                                    '& th, & td': {
                                                        borderBottom: '1px solid',
                                                        borderColor: 'divider',
                                                        p: 1,
                                                        textAlign: 'left',
                                                        whiteSpace: 'nowrap',
                                                        verticalAlign: 'middle',
                                                    },
                                                    '& th': { color: 'text.secondary', fontWeight: 600 },
                                                }}
                                            >
                                                <thead>
                                                <tr>
                                                    <th>Nombre</th>
                                                    <th>Email</th>
                                                    <th>Rol</th>
                                                    <th>Estado</th>
                                                    <th>Acciones</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {usuarios.map((u) => (
                                                    <tr key={u.id_usuario}>
                                                        <td>
                                                            {u.nombre} {u.apellido}
                                                        </td>
                                                        <td>{u.email}</td>
                                                        <td>
                                                            <Chip
                                                                size="small"
                                                                label={u.id_rol}
                                                                color={
                                                                    u.id_rol === 'ADMIN'
                                                                        ? 'primary'
                                                                        : u.id_rol === 'RRHH'
                                                                            ? 'secondary'
                                                                            : 'default'
                                                                }
                                                            />
                                                        </td>
                                                        <td>
                                                            <Chip
                                                                size="small"
                                                                label={u.estado}
                                                                color={
                                                                    u.estado === 'ACTIVO'
                                                                        ? 'success'
                                                                        : 'default'
                                                                }
                                                                variant={
                                                                    u.estado === 'ACTIVO'
                                                                        ? 'filled'
                                                                        : 'outlined'
                                                                }
                                                            />
                                                        </td>
                                                        <td>
                                                            <Box display="flex" gap={1}>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    onClick={() => abrirEditar(u)}
                                                                >
                                                                    Editar
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    color="error"
                                                                    variant="outlined"
                                                                    onClick={() => abrirEliminar(u)}
                                                                >
                                                                    Eliminar
                                                                </Button>
                                                            </Box>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </Box>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>

                {/* ======================
            DIALOG: EDITAR
           ====================== */}
                <Dialog open={openEdit} onClose={cerrarEditar} fullWidth maxWidth="sm">
                    <DialogTitle>Editar usuario</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Nombre"
                                    fullWidth
                                    value={editNombre}
                                    onChange={(e) => setEditNombre(e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Apellido"
                                    fullWidth
                                    value={editApellido}
                                    onChange={(e) => setEditApellido(e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Email"
                                    type="email"
                                    fullWidth
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Nueva contraseña (opcional)"
                                    type="password"
                                    fullWidth
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    helperText="Si no quieres cambiarla, déjalo vacío."
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Rol"
                                    select
                                    fullWidth
                                    value={editRol}
                                    onChange={(e) => setEditRol(e.target.value as Rol)}
                                >
                                    <MenuItem value="FUNCIONARIO">FUNCIONARIO</MenuItem>
                                    <MenuItem value="RRHH">RRHH</MenuItem>
                                    <MenuItem value="ADMIN">ADMIN</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Estado"
                                    select
                                    fullWidth
                                    value={editEstado}
                                    onChange={(e) =>
                                        setEditEstado(e.target.value as 'ACTIVO' | 'INACTIVO')
                                    }
                                >
                                    <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                                    <MenuItem value="INACTIVO">INACTIVO</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={cerrarEditar} disabled={loadingEdit}>
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => void guardarEdicion()}
                            disabled={loadingEdit}
                        >
                            {loadingEdit ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ======================
            DIALOG: ELIMINAR
           ====================== */}
                <Dialog
                    open={openDelete}
                    onClose={cerrarEliminar}
                    fullWidth
                    maxWidth="xs"
                >
                    <DialogTitle>Eliminar usuario</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary">
                            ¿Seguro que deseas eliminar:
                        </Typography>
                        <Typography sx={{ mt: 1, fontWeight: 600 }}>
                            {deleteUserLabel}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Esta acción no se puede deshacer.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={cerrarEliminar} disabled={loadingDelete}>
                            Cancelar
                        </Button>
                        <Button
                            color="error"
                            variant="contained"
                            onClick={() => void confirmarEliminar()}
                            disabled={loadingDelete}
                        >
                            {loadingDelete ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
}