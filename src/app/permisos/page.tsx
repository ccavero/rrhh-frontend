'use client';

import {
    Alert,
    AppBar,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    MenuItem,
    TextField,
    Toolbar,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@mui/material';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar, { SIDEBAR_WIDTH, Rol } from '../../components/Sidebar';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

type PermisoEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

type Permiso = {
    id_permiso: string;
    tipo: string;
    motivo: string;
    fecha_inicio: string;
    fecha_fin: string;
    estado: PermisoEstado;
    creado_en: string;
    resuelto_en?: string | null;
    solicitante: {
        nombre: string;
        apellido: string;
        email: string;
    };
};

export default function PermisosPage() {
    const router = useRouter();

    const [token, setToken] = useState<string | null>(null);
    const [usuarioNombre, setUsuarioNombre] = useState<string>('Usuario');
    const [usuarioRol, setUsuarioRol] = useState<Rol>('FUNCIONARIO');

    // Formulario de solicitud
    const [tipo, setTipo] = useState('VACACION');
    const [motivo, setMotivo] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [mensajeOK, setMensajeOK] = useState<string | null>(null);
    const [errorForm, setErrorForm] = useState<string | null>(null);

    // Pendientes (RRHH / ADMIN)
    const [pendientes, setPendientes] = useState<Permiso[]>([]);
    const [cargandoPendientes, setCargandoPendientes] = useState(false);
    const [errorPendientes, setErrorPendientes] = useState<string | null>(null);
    const [resolviendoId, setResolviendoId] = useState<string | null>(null);

    // ============================
    // Cargar usuario y token
    // ============================
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const t = window.localStorage.getItem('token');
        const u = window.localStorage.getItem('usuario');

        if (!t) {
            router.push('/');
            return;
        }

        setToken(t);

        if (u) {
            try {
                const parsed = JSON.parse(u) as {
                    nombre?: string;
                    apellido?: string;
                    id_rol?: Rol;
                };

                const nombreCompleto = `${parsed.nombre ?? ''} ${
                    parsed.apellido ?? ''
                }`.trim();
                setUsuarioNombre(nombreCompleto || 'Usuario');

                if (parsed.id_rol) {
                    setUsuarioRol(parsed.id_rol);
                }
            } catch {
                setUsuarioNombre('Usuario');
                setUsuarioRol('FUNCIONARIO');
            }
        }
    }, [router]);

    // ============================
    // Cargar permisos pendientes (solo RRHH / ADMIN)
    // ============================
    async function cargarPendientes() {
        if (!token) return;
        if (usuarioRol === 'FUNCIONARIO') return;

        setCargandoPendientes(true);
        setErrorPendientes(null);

        try {
            const res = await fetch(`${API_BASE_URL}/permisos/pendientes`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const msg =
                    data?.message ?? 'Error al obtener los permisos pendientes.';
                setErrorPendientes(msg);
                return;
            }

            const data = (await res.json()) as Permiso[];
            setPendientes(data);
        } catch {
            setErrorPendientes('Error de conexión al cargar permisos pendientes.');
        } finally {
            setCargandoPendientes(false);
        }
    }

    useEffect(() => {
        void cargarPendientes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, usuarioRol]);

    // ============================
    // Enviar solicitud de permiso
    // ============================
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!token) {
            setErrorForm('No hay token de sesión. Inicia sesión nuevamente.');
            return;
        }

        setEnviando(true);
        setMensajeOK(null);
        setErrorForm(null);

        try {
            const res = await fetch(`${API_BASE_URL}/permisos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    tipo,
                    motivo,
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin,
                }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok || !data) {
                const msg =
                    data?.message ??
                    (res.status === 400
                        ? 'Datos inválidos o regla de negocio no cumplida.'
                        : 'Error al registrar el permiso.');
                setErrorForm(msg);
                return;
            }

            setMensajeOK('Permiso registrado correctamente.');
            setMotivo('');
            setFechaInicio('');
            setFechaFin('');

            // Si el usuario es RRHH/ADMIN, recargamos pendientes por si se solicitó
            void cargarPendientes();
        } catch {
            setErrorForm('Error de conexión al registrar el permiso.');
        } finally {
            setEnviando(false);
        }
    }

    // ============================
    // Resolver permiso (RRHH / ADMIN)
    // ============================
    async function resolverPermiso(id_permiso: string, estado: PermisoEstado) {
        if (!token) {
            setErrorPendientes('No hay token de sesión. Inicia sesión nuevamente.');
            return;
        }

        setResolviendoId(id_permiso);
        setErrorPendientes(null);

        try {
            const res = await fetch(`${API_BASE_URL}/permisos/${id_permiso}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ estado }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok || !data) {
                const msg =
                    data?.message ??
                    'No se pudo actualizar el estado del permiso.';
                setErrorPendientes(msg);
                return;
            }

            // Volver a cargar lista de pendientes
            await cargarPendientes();
        } catch {
            setErrorPendientes('Error de conexión al resolver el permiso.');
        } finally {
            setResolviendoId(null);
        }
    }

    // ============================
    // Logout
    // ============================
    function handleLogout() {
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem('token');
            window.localStorage.removeItem('usuario');
        }
        router.push('/');
    }

    const esGestor = usuarioRol === 'ADMIN' || usuarioRol === 'RRHH';

    return (
        <Box sx={{ display: 'flex' }}>
            {/* AppBar superior */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div">
                        B.T.O. – RRHH AGETIC
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Sidebar con rol */}
            <Sidebar
                usuarioNombre={usuarioNombre}
                usuarioRol={usuarioRol}
                onLogout={handleLogout}
            />

            {/* Contenido principal */}
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
                    Permisos
                </Typography>

                <Grid container spacing={3}>
                    {/* Formulario de solicitud (todos los roles pueden pedir permiso) */}
                    <Grid item xs={12} md={esGestor ? 6 : 8}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Solicitar permiso
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    Completa el formulario para registrar una solicitud de
                                    permiso (vacación, enfermedad, onomástico, etc.).
                                </Typography>

                                {errorForm && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {errorForm}
                                    </Alert>
                                )}

                                {mensajeOK && (
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        {mensajeOK}
                                    </Alert>
                                )}

                                <Box component="form" onSubmit={handleSubmit}>
                                    <TextField
                                        select
                                        label="Tipo de permiso"
                                        fullWidth
                                        margin="normal"
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value)}
                                    >
                                        <MenuItem value="VACACION">Vacación</MenuItem>
                                        <MenuItem value="ENFERMEDAD">Enfermedad</MenuItem>
                                        <MenuItem value="ONOMASTICO">Onomástico</MenuItem>
                                        <MenuItem value="COMISION">Comisión</MenuItem>
                                        <MenuItem value="GOCE">Con goce de haberes</MenuItem>
                                        <MenuItem value="SIN_GOCE">Sin goce de haberes</MenuItem>
                                    </TextField>

                                    <TextField
                                        label="Motivo"
                                        fullWidth
                                        margin="normal"
                                        multiline
                                        minRows={3}
                                        value={motivo}
                                        onChange={(e) => setMotivo(e.target.value)}
                                        required
                                    />

                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            label="Fecha inicio"
                                            type="date"
                                            fullWidth
                                            margin="normal"
                                            InputLabelProps={{ shrink: true }}
                                            value={fechaInicio}
                                            onChange={(e) => setFechaInicio(e.target.value)}
                                            required
                                        />
                                        <TextField
                                            label="Fecha fin"
                                            type="date"
                                            fullWidth
                                            margin="normal"
                                            InputLabelProps={{ shrink: true }}
                                            value={fechaFin}
                                            onChange={(e) => setFechaFin(e.target.value)}
                                            required
                                        />
                                    </Box>

                                    <Box mt={3} display="flex" justifyContent="flex-end">
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={enviando}
                                        >
                                            {enviando ? (
                                                <CircularProgress size={20} color="inherit" />
                                            ) : (
                                                'Enviar solicitud'
                                            )}
                                        </Button>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Lista de pendientes (solo RRHH / ADMIN) */}
                    {esGestor && (
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Permisos pendientes
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        Revisa y resuelve las solicitudes de permiso registradas por
                                        el personal.
                                    </Typography>

                                    {errorPendientes && (
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {errorPendientes}
                                        </Alert>
                                    )}

                                    {cargandoPendientes && (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                my: 2,
                                            }}
                                        >
                                            <CircularProgress size={24} />
                                        </Box>
                                    )}

                                    {!cargandoPendientes && pendientes.length === 0 && !errorPendientes && (
                                        <Typography variant="body2" color="text.secondary">
                                            No hay permisos pendientes.
                                        </Typography>
                                    )}

                                    {pendientes.length > 0 && (
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Funcionario</TableCell>
                                                    <TableCell>Tipo</TableCell>
                                                    <TableCell>Rango</TableCell>
                                                    <TableCell align="center">Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {pendientes.map((p) => (
                                                    <TableRow key={p.id_permiso}>
                                                        <TableCell>
                                                            {p.solicitante.nombre} {p.solicitante.apellido}
                                                            <br />
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {p.solicitante.email}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>{p.tipo}</TableCell>
                                                        <TableCell>
                                                            {p.fecha_inicio} — {p.fecha_fin}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    gap: 1,
                                                                    justifyContent: 'center',
                                                                }}
                                                            >
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="success"
                                                                    disabled={resolviendoId === p.id_permiso}
                                                                    onClick={() =>
                                                                        void resolverPermiso(
                                                                            p.id_permiso,
                                                                            'APROBADO',
                                                                        )
                                                                    }
                                                                >
                                                                    {resolviendoId === p.id_permiso
                                                                        ? '...'
                                                                        : 'Aprobar'}
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="error"
                                                                    disabled={resolviendoId === p.id_permiso}
                                                                    onClick={() =>
                                                                        void resolverPermiso(
                                                                            p.id_permiso,
                                                                            'RECHAZADO',
                                                                        )
                                                                    }
                                                                >
                                                                    {resolviendoId === p.id_permiso
                                                                        ? '...'
                                                                        : 'Rechazar'}
                                                                </Button>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Box>
    );
}