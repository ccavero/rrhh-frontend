// src/components/Sidebar.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
    Avatar,
    Box,
    Button,
    Divider,
    Drawer,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
} from '@mui/material';

import DashboardIcon from '@mui/icons-material/Dashboard';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';

export const SIDEBAR_WIDTH = 240;

export type Rol = 'ADMIN' | 'RRHH' | 'FUNCIONARIO';

type SidebarProps = {
    usuarioNombre: string;
    usuarioRol: Rol;
    onLogout: () => void;
};

type NavItem = {
    key: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    roles: Rol[];
};

const NAV_ITEMS: NavItem[] = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: <DashboardIcon fontSize="small" />,
        roles: ['ADMIN', 'RRHH', 'FUNCIONARIO'],
    },
    {
        key: 'asistencia',
        label: 'Mis asistencias',
        href: '/asistencia',
        icon: <AccessTimeIcon fontSize="small" />,
        roles: ['ADMIN', 'RRHH', 'FUNCIONARIO'],
    },
    {
        key: 'permisos',
        label: 'Permisos',
        href: '/permisos',
        icon: <EventNoteIcon fontSize="small" />,
        roles: ['ADMIN', 'RRHH', 'FUNCIONARIO'],
    },
    {
        key: 'usuarios',
        label: 'Usuarios',
        href: '/usuarios',
        icon: <PeopleIcon fontSize="small" />,
        roles: ['ADMIN', 'RRHH'],
    },
];

export default function Sidebar({ usuarioNombre, usuarioRol, onLogout }: SidebarProps) {
    const pathname = usePathname();

    const itemsVisibles = React.useMemo(
        () => NAV_ITEMS.filter((item) => item.roles.includes(usuarioRol)),
        [usuarioRol],
    );

    const inicial = (usuarioNombre?.trim()?.charAt(0) || 'U').toUpperCase();

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: SIDEBAR_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: SIDEBAR_WIDTH,
                    boxSizing: 'border-box',
                    borderRightColor: 'divider',
                },
            }}
        >
            <Toolbar />

            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Perfil */}
                <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ListItemAvatar sx={{ minWidth: 'auto' }}>
                            <Avatar sx={{ width: 44, height: 44 }}>{inicial}</Avatar>
                        </ListItemAvatar>

                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle1" noWrap>
                                {usuarioNombre || 'Usuario'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {usuarioRol}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Divider />

                {/* Menú */}
                <List sx={{ px: 1, py: 1 }}>
                    {itemsVisibles.map((item) => {
                        const selected =
                            pathname === item.href || pathname.startsWith(`${item.href}/`);

                        return (
                            <ListItemButton
                                key={item.key}
                                component={Link}
                                href={item.href}
                                selected={selected}
                                sx={{
                                    borderRadius: 2,
                                    mx: 0.5,
                                    my: 0.25,
                                    '& .MuiListItemIcon-root': {
                                        minWidth: 36,
                                        color: selected ? 'primary.main' : 'text.secondary',
                                    },
                                    '& .MuiListItemText-primary': {
                                        fontWeight: selected ? 600 : 500,
                                    },
                                    '&.Mui-selected': {
                                        bgcolor: 'action.selected',
                                    },
                                    '&.Mui-selected:hover': {
                                        bgcolor: 'action.selected',
                                    },
                                }}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        );
                    })}
                </List>

                {/* Logout abajo */}
                <Box sx={{ mt: 'auto', p: 2 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        fullWidth
                        startIcon={<LogoutIcon />}
                        onClick={onLogout}
                        sx={{ borderRadius: 2 }}
                    >
                        Cerrar sesión
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}