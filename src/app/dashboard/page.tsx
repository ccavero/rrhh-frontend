// src/app/dashboard/page.tsx
'use client';

import {
    AppBar,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Toolbar,
    Typography,
    Alert,
    Grid,
    Chip,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventBusyIcon from '@mui/icons-material/EventBusy';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar, { SIDEBAR_WIDTH, Rol } from '../../components/Sidebar';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

type Asistencia = {
    id_asistencia: string;
    tipo: 'entrada' | 'salida';
    fecha_hora: string;
    estado: string;
    origen: string;
};

type AsistenciaResumenDiario = {
    fecha: string; // YYYY-MM-DD
    horaEntrada: string; // HH:MM
    horaSalida: string; // HH:MM
    minutosTrabajados: number;
    estado: 'OK' | 'SIN_REGISTRO' | 'PERMISO' | 'FDS';
};

type PermisoEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

type Permiso = {
    id_permiso: string;
    tipo: string;
    motivo: string;
    fecha_inicio: string;
    fecha_fin: string;
    estado: PermisoEstado;
};

type Usuario = {
    id_usuario: string;
    nombre: string;
    apellido: string;
    email: string;
    id_rol: Rol;
    estado: string;
};

function pad2(n: number) {
    return n.toString().padStart(2, '0');
}

function toISODate(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function daysInMonth(year: number, monthIndex0: number): number {
    return new Date(year, monthIndex0 + 1, 0).getDate();
}

function isWeekendISO(isoDate: string): boolean {
    // isoDate YYYY-MM-DD (lo tratamos como fecha local)
    const [y, m, d] = isoDate.split('-').map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    const day = dt.getDay(); // 0 domingo, 6 sábado
    return day === 0 || day === 6;
}

export default function DashboardPage() {
    const router = useRouter();

    const [token, setToken] = useState<string | null>(null);
    const [usuarioNombre, setUsuarioNombre] = useState<string>('Usuario');
    const [usuarioRol, setUsuarioRol] = useState<Rol>('FUNCIONARIO');

    const [loadingAccion, setLoadingAccion] = useState<'entrada' | 'salida' | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);

    // Datos propios
    const [misAsistencias, setMisAsistencias] = useState<Asistencia[]>([]);
    const [resumenDiario, setResumenDiario] = useState<AsistenciaResumenDiario[]>(
        [],
    );
    const [misPermisos, setMisPermisos] = useState<Permiso[]>([]);

    // Datos globales (solo RRHH / ADMIN)
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [permisosPendientes, setPermisosPendientes] = useState<Permiso[]>([]);
    const [loadingGlobal, setLoadingGlobal] = useState(false);

    // ====================================
    // Cargar usuario + token
    // ====================================
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

    const esGestor = usuarioRol === 'ADMIN' || usuarioRol === 'RRHH';

    // ====================================
    // Cargar mis asistencias (solo para refrescar semana y/o lógica)
    // ====================================
    async function cargarMisAsistencias() {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/asistencia/mias`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const msg = data?.message ?? 'Error al obtener tus asistencias.';
                setError(msg);
                return;
            }

            const data = (await res.json()) as Asistencia[];
            setMisAsistencias(data);
        } catch {
            setError('Error de conexión al cargar asistencias.');
        }
    }

    // ====================================
    // Cargar resumen diario del mes (desde backend)
    // ====================================
    async function cargarResumenDiario() {
        if (!token) return;

        try {
            const hoy = new Date();
            const fromDate = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            const toDate = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

            const from = toISODate(fromDate);
            const to = toISODate(toDate);

            const res = await fetch(
                `${API_BASE_URL}/asistencia/mias/resumen-diario?from=${from}&to=${to}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const msg = data?.message ?? 'Error al obtener el resumen diario.';
                setError(msg);
                return;
            }

            const data = (await res.json()) as AsistenciaResumenDiario[];
            setResumenDiario(data);
        } catch {
            setError('Error de conexión al cargar resumen diario.');
        }
    }

    // ====================================
    // Cargar mis permisos
    // ====================================
    async function cargarMisPermisos() {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/permisos/mios`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const msg = data?.message ?? 'Error al obtener tus permisos.';
                setError(msg);
                return;
            }

            const data = (await res.json()) as Permiso[];
            setMisPermisos(data);
        } catch {
            setError('Error de conexión al cargar permisos.');
        }
    }

    // ====================================
    // Cargar datos globales (RRHH / ADMIN)
    // ====================================
    async function cargarDatosGlobales() {
        if (!token || !esGestor) return;

        setLoadingGlobal(true);

        try {
            const resUsuarios = await fetch(`${API_BASE_URL}/usuarios`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (resUsuarios.ok) {
                const dataUsuarios = (await resUsuarios.json()) as Usuario[];
                setUsuarios(dataUsuarios);
            }

            const resPermPend = await fetch(`${API_BASE_URL}/permisos/pendientes`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (resPermPend.ok) {
                const dataPend = (await resPermPend.json()) as Permiso[];
                setPermisosPendientes(dataPend);
            }
        } catch {
            // no-op
        } finally {
            setLoadingGlobal(false);
        }
    }

    useEffect(() => {
        void cargarMisAsistencias();
        void cargarResumenDiario();
        void cargarMisPermisos();
        void cargarDatosGlobales();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, esGestor]);

    // ====================================
    // Registrar asistencia desde dashboard
    // ====================================
    async function registrarAsistencia(tipo: 'entrada' | 'salida') {
        if (!token) {
            setError('No hay token de sesión. Inicia sesión nuevamente.');
            return;
        }

        setLoadingAccion(tipo);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/asistencia`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    tipo,
                    origen: 'web',
                    ip_registro: '127.0.0.1',
                }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok || !data) {
                const msg =
                    data?.message ??
                    (res.status === 400
                        ? 'No se pudo registrar la asistencia (regla de negocio).'
                        : 'Error al registrar la asistencia.');
                setError(msg);
                return;
            }

            await cargarMisAsistencias();
            await cargarResumenDiario();
        } catch {
            setError('Error de conexión al registrar la asistencia.');
        } finally {
            setLoadingAccion(null);
        }
    }

    // ====================================
    // Logout
    // ====================================
    function handleLogout() {
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem('token');
            window.localStorage.removeItem('usuario');
        }
        router.push('/');
    }

    // ====================================
    // Cálculo horas trabajadas semana actual (desde resumen)
    // ====================================
    const horasSemana = useMemo(() => {
        if (!resumenDiario.length) return 0;

        const hoy = new Date();
        const inicioSemana = new Date(hoy);
        const dia = inicioSemana.getDay(); // 0=domingo
        const diff = (dia + 6) % 7; // desde lunes
        inicioSemana.setDate(inicioSemana.getDate() - diff);
        inicioSemana.setHours(0, 0, 0, 0);

        const inicioKey = toISODate(inicioSemana);

        const minutos = resumenDiario
            .filter((d) => d.fecha >= inicioKey)
            .reduce((acc, d) => acc + d.minutosTrabajados, 0);

        const horas = minutos / 60;
        return Math.round(horas * 10) / 10;
    }, [resumenDiario]);

    // ====================================
    // Resúmenes globales
    // ====================================
    const resumenUsuarios = useMemo(() => {
        const total = usuarios.length;
        const activos = usuarios.filter((u) => u.estado === 'ACTIVO').length;
        const porRol: Record<Rol, number> = {
            ADMIN: 0,
            RRHH: 0,
            FUNCIONARIO: 0,
        };
        for (const u of usuarios) {
            porRol[u.id_rol] = (porRol[u.id_rol] ?? 0) + 1;
        }
        return { total, activos, porRol };
    }, [usuarios]);

    const permisosPendientesUsuario = misPermisos.filter(
        (p) => p.estado === 'PENDIENTE',
    );
    const permisosAprobadosUsuario = misPermisos.filter(
        (p) => p.estado === 'APROBADO',
    );

    // ====================================
    // Tabla del mes: aseguramos TODOS los días
    // ====================================
    const mesCompleto = useMemo(() => {
        const hoy = new Date();
        const y = hoy.getFullYear();
        const m0 = hoy.getMonth(); // 0-based
        const total = daysInMonth(y, m0);

        const map = new Map<string, AsistenciaResumenDiario>();
        for (const r of resumenDiario) map.set(r.fecha, r);

        const rows: AsistenciaResumenDiario[] = [];
        for (let day = 1; day <= total; day++) {
            const iso = `${y}-${pad2(m0 + 1)}-${pad2(day)}`;

            const existing = map.get(iso);
            if (existing) {
                rows.push(existing);
            } else {
                const weekend = isWeekendISO(iso);
                rows.push({
                    fecha: iso,
                    horaEntrada: '00:00',
                    horaSalida: '00:00',
                    minutosTrabajados: 0,
                    estado: weekend ? 'FDS' : 'SIN_REGISTRO',
                });
            }
        }
        return rows;
    }, [resumenDiario]);

    // Helper minutos → HH:MM
    const formatMinutos = (min: number): string => {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${pad2(h)}:${pad2(m)}`;
    };

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

            {/* Sidebar */}
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
                    Dashboard
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Tarjetas resumen propias */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Horas trabajadas (semana)
                                </Typography>
                                <Box display="flex" alignItems="center" mt={1} gap={1}>
                                    <AccessTimeIcon color="primary" />
                                    <Typography variant="h4">{horasSemana}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        horas
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Mis permisos pendientes
                                </Typography>
                                <Box display="flex" alignItems="center" mt={1} gap={1}>
                                    <AssignmentIcon color="warning" />
                                    <Typography variant="h4">
                                        {permisosPendientesUsuario.length}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Mis permisos aprobados
                                </Typography>
                                <Box display="flex" alignItems="center" mt={1} gap={1}>
                                    <AssignmentIcon color="success" />
                                    <Typography variant="h4">
                                        {permisosAprobadosUsuario.length}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Tarjetas globales */}
                    {esGestor && (
                        <>
                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Usuarios registrados
                                        </Typography>
                                        <Box display="flex" alignItems="center" mt={1} gap={2}>
                                            <PeopleIcon color="primary" />
                                            <Box>
                                                <Typography variant="h4">
                                                    {resumenUsuarios.total}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {resumenUsuarios.activos} activos
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                                            <Chip
                                                size="small"
                                                label={`ADMIN: ${resumenUsuarios.porRol.ADMIN}`}
                                            />
                                            <Chip
                                                size="small"
                                                label={`RRHH: ${resumenUsuarios.porRol.RRHH}`}
                                            />
                                            <Chip
                                                size="small"
                                                label={`FUNC.: ${resumenUsuarios.porRol.FUNCIONARIO}`}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Permisos pendientes a revisar
                                        </Typography>
                                        <Box display="flex" alignItems="center" mt={1} gap={1}>
                                            <AssignmentIcon color="error" />
                                            <Typography variant="h4">
                                                {permisosPendientes.length}
                                            </Typography>
                                        </Box>
                                        {loadingGlobal && (
                                            <Box mt={1}>
                                                <CircularProgress size={20} />
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </>
                    )}

                    {/* Acciones rápidas */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Registrar asistencia rápida
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    Usa estos botones para marcar entrada o salida directamente
                                    desde el dashboard.
                                </Typography>

                                <Box display="flex" gap={2} flexWrap="wrap">
                                    <Box
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            cursor: 'pointer',
                                            backgroundColor: '#e8f5e9',
                                            borderRadius: '999px',
                                            px: 2,
                                            py: 1,
                                        }}
                                        onClick={() => void registrarAsistencia('entrada')}
                                    >
                                        <PlayArrowIcon color="success" />
                                        <Typography variant="body2">
                                            {loadingAccion === 'entrada'
                                                ? 'Marcando entrada...'
                                                : 'Comenzar jornada'}
                                        </Typography>
                                    </Box>

                                    <Box
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            cursor: 'pointer',
                                            backgroundColor: '#ffebee',
                                            borderRadius: '999px',
                                            px: 2,
                                            py: 1,
                                        }}
                                        onClick={() => void registrarAsistencia('salida')}
                                    >
                                        <StopIcon color="error" />
                                        <Typography variant="body2">
                                            {loadingAccion === 'salida'
                                                ? 'Marcando salida...'
                                                : 'Terminar jornada'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Resumen diario del mes (TODOS los días) */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Horas del mes
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    Vista diaria del mes completo. Los fines de semana se muestran
                                    con ícono rojo.
                                </Typography>

                                {mesCompleto.length === 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                        No hay datos todavía.
                                    </Typography>
                                )}

                                {mesCompleto.length > 0 && (
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Start time</TableCell>
                                                <TableCell>End time</TableCell>
                                                <TableCell>Total</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {mesCompleto.map((d) => {
                                                const weekend = d.estado === 'FDS' || isWeekendISO(d.fecha);

                                                const Icon = weekend ? EventBusyIcon : CalendarMonthIcon;

                                                return (
                                                    <TableRow
                                                        key={d.fecha}
                                                        sx={{
                                                            opacity: weekend ? 0.85 : 1,
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Icon fontSize="small" color={weekend ? 'error' : 'primary'} />
                                                                <Typography variant="body2">{d.fecha}</Typography>
                                                                {d.estado === 'PERMISO' && (
                                                                    <Chip size="small" label="PERMISO" color="warning" />
                                                                )}
                                                                {d.estado === 'SIN_REGISTRO' && !weekend && (
                                                                    <Chip size="small" label="SIN REGISTRO" variant="outlined" />
                                                                )}
                                                            </Box>
                                                        </TableCell>

                                                        <TableCell>{d.horaEntrada}</TableCell>
                                                        <TableCell>{d.horaSalida}</TableCell>
                                                        <TableCell>{formatMinutos(d.minutosTrabajados)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Mis permisos */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Mis solicitudes de permiso
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    Revisa el estado de tus últimas solicitudes de permiso.
                                </Typography>

                                {misPermisos.length === 0 && (
                                    <Typography variant="body2" color="text.secondary">
                                        Aún no tienes solicitudes de permiso registradas.
                                    </Typography>
                                )}

                                {misPermisos.length > 0 && (
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Tipo</TableCell>
                                                <TableCell>Rango</TableCell>
                                                <TableCell>Estado</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {misPermisos.slice(0, 5).map((p) => (
                                                <TableRow key={p.id_permiso}>
                                                    <TableCell>{p.tipo}</TableCell>
                                                    <TableCell>
                                                        {p.fecha_inicio} — {p.fecha_fin}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={p.estado}
                                                            size="small"
                                                            color={
                                                                p.estado === 'APROBADO'
                                                                    ? 'success'
                                                                    : p.estado === 'PENDIENTE'
                                                                        ? 'warning'
                                                                        : 'default'
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}