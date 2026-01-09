// src/lib/types.ts

// ==============================
// Roles / enums de dominio
// ==============================
export type Rol = 'ADMIN' | 'RRHH' | 'FUNCIONARIO';

export type UsuarioEstado = 'ACTIVO' | 'INACTIVO';

// ==============================
// Asistencia
// ==============================
export type AsistenciaTipo = 'ENTRADA' | 'SALIDA';

export type AsistenciaEstado = 'VALIDA' | 'ANULADA';

export type AsistenciaOrigen = 'web' | 'manual' | string;

export type Asistencia = {
    id_asistencia: string;
    tipo: AsistenciaTipo;
    fecha_hora: string; // ISO
    estado: AsistenciaEstado | string;
    origen: AsistenciaOrigen;
    observacion?: string | null;
    id_usuario?: string; // útil en vistas RRHH
};

// ==============================
// Resumen diario
// ==============================
export type AsistenciaResumenEstado =
    | 'OK'
    | 'SIN_REGISTRO'
    | 'PERMISO'
    | 'FDS'
    | 'INCOMPLETO';

export type AsistenciaResumenDiario = {
    fecha: string; // YYYY-MM-DD
    horaEntrada: string; // HH:mm (viene formateado por backend)
    horaSalida: string; // HH:mm
    minutosTrabajados: number;
    minutosObjetivo?: number;
    estado: AsistenciaResumenEstado;
};

// ==============================
// Permisos
// ==============================
export type PermisoEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export type Permiso = {
    id_permiso: string;
    tipo: string;
    motivo: string;
    fecha_inicio: string; // YYYY-MM-DD
    fecha_fin: string; // YYYY-MM-DD
    estado: PermisoEstado;
    con_goce?: boolean | null;
    id_solicitante?: string; // útil para RRHH
    id_resolvedor?: string | null; // útil para RRHH
};

export type ResolverPermisoPayload = {
    estado: 'APROBADO' | 'RECHAZADO';
    con_goce?: boolean;
    observacion?: string;
};

// ==============================
// Jornada (para módulo Usuarios)
// ==============================
export type JornadaDia = {
    dia_semana: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    hora_inicio: string; // "HH:mm:ss"
    hora_fin: string; // "HH:mm:ss"
    minutos_objetivo: number; // 0..1440
    activo?: boolean; // default true
    tolerancia_minutos?: number; // 0..240
};

export type JornadaSemanal = {
    dias: JornadaDia[];
};

// ==============================
// Usuario
// ==============================
export type Usuario = {
    id_usuario: string;
    nombre: string;
    apellido: string;
    email: string;
    id_rol: Rol;
    estado: UsuarioEstado | string;
    creado_en?: string;
};

// Para creación/edición desde RRHH
export type CrearUsuarioConJornadaPayload = {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    id_rol: Rol;
    estado?: UsuarioEstado;
    jornada: JornadaSemanal;
};

export type ActualizarUsuarioPayload = Partial<{
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    id_rol: Rol;
    estado: UsuarioEstado;
}>;