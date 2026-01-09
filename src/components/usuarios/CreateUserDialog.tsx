'use client';

import { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography,
} from '@mui/material';

import type { CrearUsuarioConJornadaPayload, JornadaDia, JornadaSemanal, Rol, UsuarioEstado } from '../../lib/types';

function dayLabel(d: number) {
    return ['','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][d] ?? `Día ${d}`;
}

function toHHMM(hhmmss: string) {
    return (hhmmss ?? '').slice(0, 5);
}

function toHHMMSS(hhmm: string) {
    if (!hhmm) return '';
    return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}

function defaultJornada(): JornadaSemanal {
    const dias: JornadaDia[] = [];
    for (let day = 1 as 1 | 2 | 3 | 4 | 5 | 6 | 7; day <= 7; day = (day + 1) as any) {
        dias.push({
            dia_semana: day,
            hora_inicio: '08:30:00',
            hora_fin: '16:30:00',
            minutos_objetivo: 480,
            activo: day <= 5, // L-V activo
            tolerancia_minutos: 0,
        });
    }
    return { dias };
}

export function CreateUserDialog(props: {
    open: boolean;
    onClose: () => void;

    loading?: boolean;
    error?: string | null;

    onSubmit: (payload: CrearUsuarioConJornadaPayload) => Promise<void>;
}) {
    const { open, onClose, loading = false, error = null, onSubmit } = props;

    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [id_rol, setRol] = useState<Rol>('FUNCIONARIO');
    const [estado, setEstado] = useState<UsuarioEstado>('ACTIVO');
    const [jornada, setJornada] = useState<JornadaSemanal>(() => defaultJornada());

    const canSubmit = useMemo(() => {
        return (
            nombre.trim().length > 0 &&
            apellido.trim().length > 0 &&
            email.trim().length > 0 &&
            password.trim().length >= 4
        );
    }, [nombre, apellido, email, password]);

    function resetForm() {
        setNombre('');
        setApellido('');
        setEmail('');
        setPassword('');
        setRol('FUNCIONARIO');
        setEstado('ACTIVO');
        setJornada(defaultJornada());
    }

    function handleClose() {
        if (!loading) {
            resetForm();
            onClose();
        }
    }

    function updateDia(idx: number, patch: Partial<JornadaDia>) {
        setJornada((prev) => ({
            ...prev,
            dias: prev.dias.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
        }));
    }

    async function handleSubmit() {
        if (!canSubmit || loading) return;

        await onSubmit({
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            email: email.trim(),
            password,
            id_rol,
            estado,
            jornada: {
                dias: jornada.dias.map((d) => ({
                    ...d,
                    hora_inicio: toHHMMSS(toHHMM(d.hora_inicio)),
                    hora_fin: toHHMMSS(toHHMM(d.hora_fin)),
                    minutos_objetivo: Number(d.minutos_objetivo) || 0,
                    tolerancia_minutos: Number(d.tolerancia_minutos ?? 0) || 0,
                })),
            },
        });

        // si no falló, cerramos
        resetForm();
        onClose();
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Crear usuario</DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Box mb={2}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                )}

                <Box
                    display="grid"
                    gap={2}
                    sx={{
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    }}
                >
                    <TextField
                        label="Nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Apellido"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        helperText="Mínimo 4 caracteres (ajústalo si tu backend exige más)"
                    />

                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Rol
                        </Typography>
                        <Select fullWidth value={id_rol} onChange={(e) => setRol(e.target.value as Rol)}>
                            <MenuItem value="FUNCIONARIO">FUNCIONARIO</MenuItem>
                            <MenuItem value="RRHH">RRHH</MenuItem>
                            <MenuItem value="ADMIN">ADMIN</MenuItem>
                        </Select>
                    </Box>

                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Estado
                        </Typography>
                        <Select fullWidth value={estado} onChange={(e) => setEstado(e.target.value as UsuarioEstado)}>
                            <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                            <MenuItem value="INACTIVO">INACTIVO</MenuItem>
                        </Select>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Jornada semanal
                </Typography>

                <Box display="grid" gap={2}>
                    {jornada.dias
                        .slice()
                        .sort((a, b) => a.dia_semana - b.dia_semana)
                        .map((d, idx) => (
                            <Box
                                key={d.dia_semana}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    p: 2,
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                                    <Typography fontWeight={700}>{dayLabel(d.dia_semana)}</Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={d.activo !== false}
                                                onChange={(e) => updateDia(idx, { activo: e.target.checked })}
                                            />
                                        }
                                        label={d.activo === false ? 'Inactivo' : 'Activo'}
                                    />
                                </Box>

                                <Box
                                    mt={2}
                                    display="grid"
                                    gap={2}
                                    sx={{
                                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' },
                                    }}
                                >
                                    <TextField
                                        label="Inicio"
                                        type="time"
                                        value={toHHMM(d.hora_inicio)}
                                        onChange={(e) => updateDia(idx, { hora_inicio: toHHMMSS(e.target.value) })}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ step: 60 }}
                                        disabled={d.activo === false}
                                    />
                                    <TextField
                                        label="Fin"
                                        type="time"
                                        value={toHHMM(d.hora_fin)}
                                        onChange={(e) => updateDia(idx, { hora_fin: toHHMMSS(e.target.value) })}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ step: 60 }}
                                        disabled={d.activo === false}
                                    />
                                    <TextField
                                        label="Minutos objetivo"
                                        type="number"
                                        value={d.minutos_objetivo}
                                        onChange={(e) => updateDia(idx, { minutos_objetivo: Number(e.target.value) })}
                                        InputLabelProps={{ shrink: true }}
                                        disabled={d.activo === false}
                                    />
                                    <TextField
                                        label="Tolerancia"
                                        type="number"
                                        value={d.tolerancia_minutos ?? 0}
                                        onChange={(e) => updateDia(idx, { tolerancia_minutos: Number(e.target.value) })}
                                        InputLabelProps={{ shrink: true }}
                                        disabled={d.activo === false}
                                    />
                                </Box>
                            </Box>
                        ))}
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit || loading}>
                    Crear
                </Button>
            </DialogActions>
        </Dialog>
    );
}