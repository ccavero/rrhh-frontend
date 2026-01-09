'use client';

import { AppBar, Toolbar, Typography } from '@mui/material';

export function DashboardHeader() {
    return (
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    B.T.O. – RRHH AGETIC
                </Typography>
            </Toolbar>
        </AppBar>
    );
}