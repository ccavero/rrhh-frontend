'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    Divider,
} from '@mui/material';
import type { JornadaDia, JornadaSemanal } from '../../../../lib/types';

function toHHMM(hhmmss: string) {
    // "08:30:00" -> "08:30"
    if (!hhmmss) return '';
    return hhmmss.slice(0, 5);
}

function toHHMMSS(hhmm: string) {
    // "08:30" -> "08:30:00"
    if (!hhmm) return '';
    return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
}

function dayLabel(d: number) {
    return ['','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][d] ?? `Día ${d}`;
}

function normalizeSemana(j: JornadaSemanal): JornadaSemanal {
    // asegura orden 1..7 y valores defaults
    const byDay = new Map<number, JornadaDia>();
    for (const d of j.dias ?? []) byDay.set(d.dia_semana, d);

    const dias: JornadaDia[] = [];
    for (let day = 1 as const; day <= 7; day++) {
        const existing = byDay.get(day);
        dias.push({
            dia_semana: day,
            hora_inicio: existing?.hora_inicio ?? '08:30:00',
            hora_fin: existing?.hora_fin ?? '16:30:00',
            minutos_objetivo: existing?.minutos_objetivo ?? 480,
            activo: existing?.activo ?? (day <= 5), // L-V activo por defecto
            tolerancia_minutos: existing?.tolerancia_minutos ?? 0,
        });
    }
    return { dias };
}

export function JornadaTab(props: {
    jornada: JornadaSemanal | null;
    loadingAccion?: boolean;
    onSaveJornada?: (payload: JornadaSemanal) => Promise<void>;
}) {
    const { jornada, loadingAccion = false, onSaveJornada } = props;

    const [openEdit, setOpenEdit] = useState(false);
    const [draft, setDraft] = useState<JornadaSemanal | null>(null);

    const view = useMemo(() => (jornada ? normalizeSemana(jornada) : null), [jornada]);

    function handleOpen() {
        setDraft(view ? JSON.parse(JSON.stringify(view)) : normalizeSemana({ dias: [] as any }));
        setOpenEdit(true);
    }

    function handleClose() {
        setOpenEdit(false);
    }

    function updateDia(idx: number, patch: Partial<JornadaDia>) {
        setDraft((prev) => {
            if (!prev) return prev;
            const next = { ...prev, dias: prev.dias.map((d, i) => (i === idx ? { ...d, ...patch } : d)) };
            return next;
        });
    }

    async function handleSave() {
        if (!draft || !onSaveJornada) return;

        // normaliza tiempos a HH:mm:ss antes de enviar
        const payload: JornadaSemanal = {
            dias: draft.dias.map((d) => ({
                ...d,
                hora_inicio: toHHMMSS(toHHMM(d.hora_inicio) || d.hora_inicio),
                hora_fin: toHHMMSS(toHHMM(d.hora_fin) || d.hora_fin),
                minutos_objetivo: Number(d.minutos_objetivo) || 0,
                tolerancia_minutos: typeof d.tolerancia_minutos === 'number' ? d.tolerancia_minutos : Number(d.tolerancia_minutos) || 0,
            })),
        };

        await onSaveJornada(payload);
        setOpenEdit(false);
    }

    return (
        <>
            <Card>
                <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Jornada semanal
                    </Typography>

                    {!view ? (
                        <Typography color="text.secondary">No hay jornada.</Typography>
                    ) : (
                        <Box display="grid" gap={1}>
                            {view.dias
                                .slice()
                                .sort((a, b) => a.dia_semana - b.dia_semana)
                                .map((d) => (
                                    <Box
                                        key={d.dia_semana}
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1 }}
                                    >
                                        <Typography>
                                            <b>{dayLabel(d.dia_semana)}:</b> {d.hora_inicio} – {d.hora_fin}
                                        </Typography>

                                        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                                            <Chip size="small" label={`${d.minutos_objetivo} min`} />
                                            <Chip
                                                size="small"
                                                label={d.activo === false ? 'INACTIVO' : 'ACTIVO'}
                                                color={d.activo === false ? 'default' : 'success'}
                                            />
                                            {typeof d.tolerancia_minutos === 'number' && (
                                                <Chip size="small" variant="outlined" label={`Tol: ${d.tolerancia_minutos}m`} />
                                            )}
                                        </Box>
                                    </Box>
                                ))}
                        </Box>
                    )}

                    <Box mt={2} display="flex" justifyContent="flex-end">
                        <Button variant="outlined" onClick={handleOpen}>
                            Editar jornada
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <Dialog open={openEdit} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>Editar jornada semanal</DialogTitle>

                <DialogContent dividers>
                    {!draft ? (
                        <Typography color="text.secondary">Cargando...</Typography>
                    ) : (
                        <Box display="grid" gap={2}>
                            {draft.dias
                                .slice()
                                .sort((a, b) => a.dia_semana - b.dia_semana)
                                .map((d, idx) => (
                                    <Box key={d.dia_semana} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
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

                                        <Divider sx={{ my: 1.5 }} />

                                        <Box
                                            display="grid"
                                            gap={2}
                                            sx={{
                                                gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' },
                                            }}
                                        >
                                            <TextField
                                                label="Hora inicio"
                                                type="time"
                                                value={toHHMM(d.hora_inicio)}
                                                onChange={(e) => updateDia(idx, { hora_inicio: toHHMMSS(e.target.value) })}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ step: 60 }}
                                                disabled={d.activo === false}
                                            />

                                            <TextField
                                                label="Hora fin"
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
                                                label="Tolerancia (min)"
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
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} disabled={loadingAccion}>
                        Cancelar
                    </Button>
                    <Button variant="contained" onClick={handleSave} disabled={loadingAccion || !onSaveJornada}>
                        Guardar cambios
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}