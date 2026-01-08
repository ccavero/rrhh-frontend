'use client';

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

// Config de navegación por rol
const NAV_ITEMS: NavItem[] = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: <DashboardIcon />,
        roles: ['ADMIN', 'RRHH', 'FUNCIONARIO'],
    },
    {
        key: 'asistencia',
        label: 'Mis asistencias',
        href: '/asistencia',
        icon: <AccessTimeIcon />,
        roles: ['ADMIN', 'RRHH', 'FUNCIONARIO'],
    },
    {
        key: 'permisos',
        label: 'Permisos',
        href: '/permisos',
        icon: <EventNoteIcon />,
        roles: ['ADMIN', 'RRHH', 'FUNCIONARIO'],
    },
    {
        key: 'usuarios',
        label: 'Usuarios',
        href: '/usuarios',
        icon: <PeopleIcon />,
        roles: ['ADMIN', 'RRHH'], // Solo admin + RRHH
    },
];

export default function Sidebar({
                                    usuarioNombre,
                                    usuarioRol,
                                    onLogout,
                                }: SidebarProps) {
    const pathname = usePathname();

    const itemsVisibles = NAV_ITEMS.filter((item) =>
        item.roles.includes(usuarioRol),
    );

    const inicial = usuarioNombre.charAt(0).toUpperCase() || 'U';

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: SIDEBAR_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: SIDEBAR_WIDTH,
                    boxSizing: 'border-box',
                },
            }}
        >
            <Toolbar />
            <Box
                sx={{
                    overflow: 'auto',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Perfil arriba */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        py: 2,
                        gap: 2,
                    }}
                >
                    <ListItemAvatar>
                        <Avatar sx={{ width: 48, height: 48 }}>{inicial}</Avatar>
                    </ListItemAvatar>
                    <Box>
                        <Typography variant="subtitle1">{usuarioNombre}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {usuarioRol}
                        </Typography>
                    </Box>
                </Box>

                <Divider />

                {/* Menú de navegación */}
                <List>
                    {itemsVisibles.map((item) => {
                        const selected =
                            pathname === item.href || pathname.startsWith(`${item.href}/`);

                        return (
                            <ListItemButton
                                key={item.key}
                                component={Link}
                                href={item.href}
                                selected={selected}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        );
                    })}
                </List>

                {/* Botón de logout abajo */}
                <Box sx={{ mt: 'auto', p: 2 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        fullWidth
                        startIcon={<LogoutIcon />}
                        onClick={onLogout}
                    >
                        Cerrar sesión
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}