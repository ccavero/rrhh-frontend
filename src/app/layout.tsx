// src/app/layout.tsx
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import MuiThemeProvider from './MuiThemeProvider';

export const metadata: Metadata = {
    title: 'RRHH AGETIC',
    description: 'Sistema de control de asistencia y permisos',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="es">
        <body>
        <MuiThemeProvider>{children}</MuiThemeProvider>
        </body>
        </html>
    );
}