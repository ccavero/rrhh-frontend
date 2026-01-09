// src/components/usuarios/drawer/tabs/AsistenciasTab.tsx
'use client';

import { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Select,
    TextField,
    Typography,
    Alert,
} from '@mui/material';

import type { Asistencia, AsistenciaResumenDiario } from '../../../../lib/types';
import { MonthHoursCard } from '../../../dashboard/MonthHoursCard';

function toLocalDatetimeInputValue(d: Date) {
    // yyyy-MM-ddThh:mm
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function AsistenciasTab(props: {
    usuarioId: string | null;
    resumen: AsistenciaResumenDiario[];
    asistencias: Asistencia[];

    loadingAccion: boolean;

    onCrearAsistenciaManual: (payload: {
        id_usuario: string;
        tipo: 'ENTRADA' | 'SALIDA';
        fecha_hora: string; // ISO
        observacion?: string;
    }) => Promise<void>;

    onAnularAsistencia: (id_asistencia: string, payload?: { observacion?: string }) => Promise<void>;
}) {
    const { usuarioId, resumen, asistencias, loadingAccion, onCrearAsistenciaManual, onAnularAsistencia } = props;

    const [openCrear, setOpenCrear] = useState(false);
    const [openAnular, setOpenAnular] = useState(false);

    // --------- Crear manual (form state)
    const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
    const [fechaHoraLocal, setFechaHoraLocal] = useState<string>(() => toLocalDatetimeInputValue(new Date()));
    const [obsCrear, setObsCrear] = useState('');

    // --------- Anular (form state)
    const anulables = useMemo(() => {
        // muestra primero las más recientes; evita anuladas si tu backend marca estado "ANULADA"
        return [...asistencias]
            .filter((a) => String(a.estado).toUpperCase() !== 'ANULADA')
            .sort((a, b) => (a.fecha_hora < b.fecha_hora ? 1 : -1));
    }, [asistencias]);

    const [idAsistencia, setIdAsistencia] = useState<string>('');
    const [obsAnular, setObsAnular] = useState('');

    async function handleCrear() {
        if (!usuarioId) return;

        // datetime-local -> ISO
        const iso = new Date(fechaHoraLocal).toISOString();

        await onCrearAsistenciaManual({
            id_usuario: usuarioId,
            tipo,
            fecha_hora: iso,
            observacion: obsCrear.trim() || undefined,
        });

        setOpenCrear(false);
        // reset opcional
        setObsCrear('');
        setTipo('ENTRADA');
        setFechaHoraLocal(toLocalDatetimeInputValue(new Date()));
    }

    async function handleAnular() {
        if (!idAsistencia) return;

        await onAnularAsistencia(idAsistencia, {
            observacion: obsAnular.trim() || undefined,
        });

        setOpenAnular(false);
        setIdAsistencia('');
        setObsAnular('');
    }

    const disabledNoUser = !usuarioId;

    return (
        <Box display="grid" gap={2}>
            {/* reutilizas tu componente del dashboard */}
            <MonthHoursCard rows={resumen} />

            <Card>
                <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Acciones
                    </Typography>

                    {disabledNoUser && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Selecciona un usuario para realizar acciones de asistencia.
                        </Alert>
                    )}

                    <Box display="flex" gap={2} flexWrap="wrap">
                        <Button
                            variant="contained"
                            disabled={loadingAccion || disabledNoUser}
                            onClick={() => setOpenCrear(true)}
                        >
                            Agregar asistencia manual
                        </Button>

                        <Button
                            variant="outlined"
                            disabled={loadingAccion || anulables.length === 0}
                            onClick={() => {
                                // preselección: la más reciente
                                setIdAsistencia(anulables[0]?.id_asistencia ?? '');
                                setOpenAnular(true);
                            }}
                        >
                            Anular asistencia
                        </Button>
                    </Box>

                    <Typography variant="body2" color="text.secondary" mt={2}>
                        Asistencias cargadas: {asistencias.length}
                    </Typography>
                </CardContent>
            </Card>

            {/* ===================== DIALOG: CREAR MANUAL ===================== */}
            <Dialog open={openCrear} onClose={() => setOpenCrear(false)} fullWidth maxWidth="sm">
                <DialogTitle>Agregar asistencia manual</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'grid', gap: 2 }}>
                    <Select value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
                        <MenuItem value="ENTRADA">ENTRADA</MenuItem>
                        <MenuItem value="SALIDA">SALIDA</MenuItem>
                    </Select>

                    <TextField
                        label="Fecha y hora"
                        type="datetime-local"
                        value={fechaHoraLocal}
                        onChange={(e) => setFechaHoraLocal(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        helperText="Se enviará como ISO al backend."
                        fullWidth
                    />

                    <TextField
                        label="Observación (opcional)"
                        value={obsCrear}
                        onChange={(e) => setObsCrear(e.target.value)}
                        fullWidth
                        multiline
                        minRows={2}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCrear(false)} disabled={loadingAccion}>
                        Cancelar
                    </Button>
                    <Button variant="contained" onClick={handleCrear} disabled={loadingAccion || disabledNoUser}>
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===================== DIALOG: ANULAR ===================== */}
            <Dialog open={openAnular} onClose={() => setOpenAnular(false)} fullWidth maxWidth="sm">
                <DialogTitle>Anular asistencia</DialogTitle>
                <DialogContent sx={{ pt: 1, display: 'grid', gap: 2 }}>
                    {anulables.length === 0 ? (
                        <Alert severity="info">No hay asistencias anulables.</Alert>
                    ) : (
                        <>
                            <Select
                                value={idAsistencia}
                                onChange={(e) => setIdAsistencia(e.target.value as string)}
                                fullWidth
                            >
                                {anulables.map((a) => (
                                    <MenuItem key={a.id_asistencia} value={a.id_asistencia}>
                                        {new Date(a.fecha_hora).toLocaleString()} — {a.tipo} ({a.origen})
                                    </MenuItem>
                                ))}
                            </Select>

                            <TextField
                                label="Observación (opcional)"
                                value={obsAnular}
                                onChange={(e) => setObsAnular(e.target.value)}
                                fullWidth
                                multiline
                                minRows={2}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAnular(false)} disabled={loadingAccion}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleAnular}
                        disabled={loadingAccion || !idAsistencia}
                    >
                        Anular
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}