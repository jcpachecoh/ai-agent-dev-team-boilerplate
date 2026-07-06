export const ATTENDANCE_ROUTES = {
  base: '/asistencia',
  panel: '/asistencia',
  collaborators: '/asistencia/colaboradores',
  shifts: '/asistencia/turnos',
  shiftsAssignment: '/asistencia/turnos/asignacion',
  monitor: '/asistencia/asistencias',
  reports: '/asistencia/reportes',
  locationDetail: (locationId: string) => `/asistencia/asistencias/${locationId}`,
  employeeCard: (locationId: string, userId: string) =>
    `/asistencia/asistencias/${locationId}/employees/${userId}/card`,
} as const;
