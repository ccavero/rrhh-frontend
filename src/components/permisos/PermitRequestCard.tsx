// src/components/permisos/PermitRequestCard.tsx
'use client';

import { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import OutlinedInput from '@mui/material/OutlinedInput';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

const TIPOS_PERMISO = [
    { value: 'VACACION', label: 'Vacación' },
    { value: 'SALUD', label: 'Salud' },
    { value: 'PERSONAL', label: 'Personal' },
    { value: 'OTRO', label: 'Otro' },
] as const;

type PermitPayload = {
    tipo: string;
    motivo: string;
    fecha_inicio: string;
    fecha_fin: string;
};

const ITEM_HEIGHT = 40;
const ITEM_PADDING_TOP = 8;

const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 6 + ITEM_PADDING_TOP,
            width: 260, // ✅ ancho fijo del menú
        },
    },
};

export function PermitRequestCard(props: {
    submitting: boolean;
    onSubmit: (payload: PermitPayload) => void;
}) {
    const { submitting, onSubmit } = props;

    const [tipo, setTipo] = useState<string>(''); // vacío hasta seleccionar
    const [motivo, setMotivo] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const finMenorQueInicio = useMemo(() => {
        return !!fechaInicio && !!fechaFin && fechaFin < fechaInicio;
    }, [fechaInicio, fechaFin]);

    const disabled = useMemo(() => {
        if (!tipo) return true;
        if (!motivo.trim()) return true;
        if (!fechaInicio) return true;
        if (!fechaFin) return true;
        return finMenorQueInicio;
    }, [tipo, motivo, fechaInicio, fechaFin, finMenorQueInicio]);

    function handleSubmit() {
        if (disabled || submitting) return;

        onSubmit({
            tipo,
            motivo: motivo.trim(),
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
        });
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Solicitar permiso
                </Typography>

                <Typography variant="body2" color="text.secondary" mb={2}>
                    Completa los datos y envía tu solicitud. (Por ahora sin adjuntos)
                </Typography>

                <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 12, md: 6 }}>
                    {/* Row 1 */}
                    <Grid size={6}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>
                            Tipo de permiso
                        </Typography>

                        <ToggleButtonGroup
                            exclusive
                            value={tipo}
                            onChange={(_, v) => {
                                // v puede ser null si clickean el mismo botón (y lo desactiva)
                                if (v !== null) setTipo(v);
                            }}
                            aria-label="Tipo de permiso"
                            sx={{
                                width: '100%',
                                display: 'grid',
                                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                                gap: 1,
                                '& .MuiToggleButton-root': {
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    fontWeight: 600,
                                    py: 1,
                                },
                            }}
                        >
                            <ToggleButton
                                value="VACACION"
                                aria-label="Vacación"
                                sx={{
                                    color: 'success.main',
                                    '&.Mui-selected': { bgcolor: 'success.main', color: 'common.white' },
                                    '&.Mui-selected:hover': { bgcolor: 'success.dark' },
                                }}
                            >
                                Vacación
                            </ToggleButton>

                            <ToggleButton
                                value="SALUD"
                                aria-label="Salud"
                                sx={{
                                    color: 'error.main',
                                    '&.Mui-selected': { bgcolor: 'error.main', color: 'common.white' },
                                    '&.Mui-selected:hover': { bgcolor: 'error.dark' },
                                }}
                            >
                                Salud
                            </ToggleButton>

                            <ToggleButton
                                value="PERSONAL"
                                aria-label="Personal"
                                sx={{
                                    color: 'warning.main',
                                    '&.Mui-selected': { bgcolor: 'warning.main', color: 'common.white' },
                                    '&.Mui-selected:hover': { bgcolor: 'warning.dark' },
                                }}
                            >
                                Personal
                            </ToggleButton>

                            <ToggleButton
                                value="OTRO"
                                aria-label="Otro"
                                sx={{
                                    color: 'info.main',
                                    '&.Mui-selected': { bgcolor: 'info.main', color: 'common.white' },
                                    '&.Mui-selected:hover': { bgcolor: 'info.dark' },
                                }}
                            >
                                Otro
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {/* helper opcional */}
                        {!tipo && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                                Selecciona un tipo para habilitar el envío.
                            </Typography>
                        )}
                    </Grid>

                    <Grid size={ 3 }>
                        <TextField
                            size="small"
                            label="Fecha inicio"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                        />
                    </Grid>

                    <Grid size={ 3 }>
                        <TextField
                            size="small"
                            label="Fecha fin"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            error={finMenorQueInicio}
                            helperText={finMenorQueInicio ? 'La fecha fin no puede ser menor a la fecha inicio.' : ' '}
                        />
                    </Grid>

                    {/* Row 2 */}
                    <Grid size={ 6 }>
                        <TextField
                            label="Motivo"
                            fullWidth
                            multiline
                            minRows={3}
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Describe brevemente el motivo..."
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box
                            display="flex"
                            justifyContent={{ xs: 'stretch', md: 'flex-end' }}
                            alignItems="flex-end"
                            height="100%"
                        >
                            <Button
                                variant="contained"
                                disabled={disabled || submitting}
                                onClick={handleSubmit}
                                sx={{ width: { xs: '100%', md: 'auto' }, height: 40 }}
                            >
                                {submitting ? 'Enviando...' : 'Enviar solicitud'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}