'use client';

import { Box, Card, CardContent, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

export function QuickAttendanceCard(props: {
    quickAction: 'ENTRADA' | 'SALIDA' | 'NONE';
    loading: 'ENTRADA' | 'SALIDA' | null;
    onMarkEntrada: () => void;
    onMarkSalida: () => void;
}) {
    const { quickAction, loading, onMarkEntrada, onMarkSalida } = props;

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Registrar asistencia rápida
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Se habilita solo la acción correcta según tu estado del día.
                </Typography>

                {quickAction === 'NONE' ? (
                    <Typography variant="body2" color="text.secondary">
                        No hay acciones disponibles hoy (ya completaste tu jornada o es fin de semana / permiso).
                    </Typography>
                ) : (
                    <Box display="flex" flexWrap="wrap">
                        {quickAction === 'ENTRADA' && (
                            <Box
                                sx={{
                                    width: '100%',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1.5,
                                    cursor: 'pointer',
                                    backgroundColor: '#e8f5e9',
                                    borderRadius: '999px',
                                    px: 3,
                                    py: 1.5,
                                    userSelect: 'none',
                                }}
                                onClick={onMarkEntrada}
                            >
                                <PlayArrowIcon color="success" />
                                <Typography variant="body1" fontWeight={600}>
                                    {loading === 'ENTRADA' ? 'Marcando entrada...' : 'Comenzar jornada'}
                                </Typography>
                            </Box>
                        )}

                        {quickAction === 'SALIDA' && (
                            <Box
                                sx={{
                                    width: '100%',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1.5,
                                    cursor: 'pointer',
                                    backgroundColor: '#ffebee',
                                    borderRadius: '999px',
                                    px: 3,
                                    py: 1.5,
                                    userSelect: 'none',
                                }}
                                onClick={onMarkSalida}
                            >
                                <StopIcon color="error" />
                                <Typography variant="body1" fontWeight={600}>
                                    {loading === 'SALIDA' ? 'Marcando salida...' : 'Terminar jornada'}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}