'use client';

import {
    Box,
    Card,
    CardContent,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Tooltip,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import type { AsistenciaResumenDiario } from '../../lib/types';
import { formatMinutos, isWeekendISO } from '../../lib/date';

const WARN_THRESHOLD_MIN = 15;      // desde 15 min por debajo del objetivo => ⚠️
const URGENT_THRESHOLD_MIN = 60;    // desde 60 min por debajo del objetivo => ⛔

export function MonthHoursCard(props: { rows: AsistenciaResumenDiario[] }) {
    const { rows } = props;

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Horas del mes
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Se muestran las horas del mes completo. Las horas vienen ya formateadas desde backend (Bolivia).
                </Typography>

                {rows.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No hay datos todavía.
                    </Typography>
                ) : (
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
                            {rows.map((d) => {
                                const weekend = d.estado === 'FDS' || isWeekendISO(d.fecha);
                                const Icon = weekend ? EventBusyIcon : CalendarMonthIcon;

                                const hasRegistro = d.estado === 'OK' || d.estado === 'INCOMPLETO';

                                // ✅ lógica de alerta por incumplir objetivo (si viene)
                                const objetivo = typeof d.minutosObjetivo === 'number' ? d.minutosObjetivo : null;
                                const diff = objetivo !== null ? objetivo - (d.minutosTrabajados ?? 0) : 0; // minutos faltantes (positivo = faltó)
                                const aplicaComparacion =
                                    !weekend &&
                                    d.estado !== 'PERMISO' &&
                                    objetivo !== null &&
                                    hasRegistro;

                                const isUrgent = aplicaComparacion && diff >= URGENT_THRESHOLD_MIN;
                                const isWarn = aplicaComparacion && diff >= WARN_THRESHOLD_MIN && diff < URGENT_THRESHOLD_MIN;

                                const AlertIcon = isUrgent ? ErrorOutlineIcon : isWarn ? WarningAmberIcon : null;

                                return (
                                    <TableRow key={d.fecha} sx={{ opacity: weekend ? 0.85 : 1 }}>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                                <Icon fontSize="small" color={weekend ? 'error' : 'primary'} />
                                                <Typography variant="body2">{d.fecha}</Typography>

                                                {/* 🔥 icono de alerta */}
                                                {AlertIcon && (
                                                    <Tooltip
                                                        title={
                                                            isUrgent
                                                                ? `Urgente: faltó ${diff} min para el objetivo (${formatMinutos(objetivo!)})`
                                                                : `Atención: faltó ${diff} min para el objetivo (${formatMinutos(objetivo!)})`
                                                        }
                                                        arrow
                                                    >
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                ml: 0.25,
                                                            }}
                                                        >
                                                            <AlertIcon
                                                                fontSize="small"
                                                                color={isUrgent ? 'error' : 'warning'}
                                                            />
                                                        </Box>
                                                    </Tooltip>
                                                )}

                                                {/* Chips de estado */}
                                                {weekend && (
                                                    <Chip size="small" label="FIN DE SEMANA" color="error" variant="outlined" />
                                                )}

                                                {!weekend && d.estado === 'PERMISO' && (
                                                    <Chip size="small" label="PERMISO" color="warning" />
                                                )}

                                                {!weekend && d.estado === 'INCOMPLETO' && (
                                                    <Chip size="small" label="INCOMPLETO" color="warning" />
                                                )}

                                                {!weekend && d.estado === 'SIN_REGISTRO' && (
                                                    <Chip size="small" label="SIN REGISTRO" variant="outlined" />
                                                )}

                                                {!weekend && hasRegistro && (
                                                    <Chip size="small" label="CON REGISTRO" color="success" variant="outlined" />
                                                )}

                                                {/* opcional: chip indicando cuánto faltó */}
                                                {aplicaComparacion && diff > 0 && (
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        color={isUrgent ? 'error' : 'warning'}
                                                        label={`- ${diff} min`}
                                                    />
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
    );
}