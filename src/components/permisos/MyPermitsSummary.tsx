'use client';

import { Card, CardContent, Grid, Typography, Box } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';

export function MyPermitsSummary(props: { pendientes: number; aprobados: number }) {
    const { pendientes, aprobados } = props;

    return (
        <Grid container rowSpacing={3} columnSpacing={{ xs: 2, sm: 3, md: 6 }} alignItems="stretch">
            <Grid size={{ xs: 12, md: 6 }} display="flex">
                <Card sx={{ width: '100%', height: '100%' }}>
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                            Mis permisos pendientes
                        </Typography>
                        <Box display="flex" alignItems="center" mt={1} gap={1}>
                            <AssignmentIcon color="warning" />
                            <Typography variant="h4">{pendientes}</Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }} display="flex">
                <Card sx={{ width: '100%', height: '100%' }}>
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                            Mis permisos aprobados
                        </Typography>
                        <Box display="flex" alignItems="center" mt={1} gap={1}>
                            <AssignmentIcon color="success" />
                            <Typography variant="h4">{aprobados}</Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}