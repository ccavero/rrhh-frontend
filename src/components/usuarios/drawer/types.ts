// src/components/usuarios/drawer/types.ts
import type {
    Asistencia,
    AsistenciaResumenDiario,
    JornadaSemanal,
    Permiso,
    ResolverPermisoPayload,
    Usuario,
} from '@/lib/types';

export type TabKey = 'overview' | 'jornada' | 'asistencias' | 'permisos';

export type UserDetailDrawerProps = {
    open: boolean;
    onClose: () => void;

    loading: boolean;
    loadingAccion?: boolean;

    error: string | null;
    onClearError: () => void;

    usuario: Usuario | null;
    jornada: JornadaSemanal | null;
    asistencias: Asistencia[];
    resumen: AsistenciaResumenDiario[];
    permisosPendientesUsuario: Permiso[];

    // acciones reales
    onResolverPermiso: (id_permiso: string, payload: ResolverPermisoPayload) => Promise<void>;

    // ✅ NUEVO: asistencias
    onCrearAsistenciaManual: (payload: {
        id_usuario: string;
        tipo: 'ENTRADA' | 'SALIDA';
        fecha_hora: string; // ISO
        observacion?: string;
    }) => Promise<void>;

    onAnularAsistencia: (id_asistencia: string, payload?: { observacion?: string }) => Promise<void>;

    onSaveJornada: (payload: JornadaSemanal) => Promise<void>;

};