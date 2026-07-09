import type { EmpleadoColumnDef } from '@restopsiq/ui';

export const MEDICAL_LEAVE_TABLE_COLUMNS: EmpleadoColumnDef[] = [
  { key: 'employee', label: 'Empleado', width: 'minmax(200px, 1.4fr)' },
  { key: 'origin', label: 'Origen', width: 'minmax(120px, 0.9fr)' },
  { key: 'period', label: 'Periodo', width: 'minmax(180px, 1.15fr)' },
  { key: 'days', label: 'Días', width: 'minmax(64px, 0.4fr)', align: 'center' },
  { key: 'employerAmount', label: 'Empleador', width: 'minmax(108px, 0.7fr)', align: 'center' },
  { key: 'epsAmount', label: 'EPS/ARL', width: 'minmax(108px, 0.7fr)', align: 'center' },
  { key: 'status', label: 'Estado', width: 'minmax(120px, max-content)', align: 'center' },
  { key: 'actions', label: 'Acciones', width: 'minmax(200px, 1fr)', align: 'center' },
];

export function getMedicalLeaveTableColumns(showActions: boolean): EmpleadoColumnDef[] {
  return showActions
    ? MEDICAL_LEAVE_TABLE_COLUMNS
    : MEDICAL_LEAVE_TABLE_COLUMNS.filter((column) => column.key !== 'actions');
}

export function getMedicalLeaveGridTemplate(showActions: boolean): string {
  return getMedicalLeaveTableColumns(showActions)
    .map((column) => column.width ?? '1fr')
    .join(' ');
}

export function getMedicalLeaveTableMinWidthPx(showActions: boolean): number {
  const columns = getMedicalLeaveTableColumns(showActions);
  const widths = columns.reduce((sum, column) => {
    const match = column.width?.match(/minmax\((\d+)px/i);
    return sum + (match ? Number(match[1]) : 96);
  }, 0);
  return widths + Math.max(columns.length - 1, 0) * 20 + 24;
}
