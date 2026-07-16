/** Roles cuyo acceso queda acotado a las sedes asignadas vía UserLocation (mismo patrón que TURNO_ASSIGNMENTS_LOCATION_SCOPED_ROLES). */
export const ATTENDANCE_COLLABORATORS_LOCATION_SCOPED_ROLES = ['SUPERVISOR', 'MANAGER'] as const;

/** Roles que pueden aparecer como "supervisor" de una sede (UserLocation + Role.code). */
export const ATTENDANCE_COLLABORATORS_SUPERVISOR_ROLES = ['SUPERVISOR', 'MANAGER'] as const;

export const ATTENDANCE_COLLABORATORS_PAGE_SIZES = [8, 20, 50, 100] as const;

export const ATTENDANCE_COLLABORATORS_SCOPE_FORBIDDEN_MESSAGE =
  'El colaborador no pertenece a una sede asignada a este usuario';

export const ATTENDANCE_COLLABORATORS_SUPERVISOR_INVALID_MESSAGE =
  'supervisorUserId debe pertenecer a un usuario con rol SUPERVISOR o MANAGER en este tenant';

/** Tope de filas exportadas por request (Excel/PDF/email) — "límite razonable" del AC de OS-550 follow-up. */
export const ATTENDANCE_COLLABORATORS_EXPORT_MAX_ROWS = 5000;

export const ATTENDANCE_COLLABORATORS_EXPORT_EMPTY_MESSAGE =
  'No hay registros para exportar con los filtros aplicados';

export const ATTENDANCE_COLLABORATORS_EXPORT_MAX_RECIPIENTS = 10;
