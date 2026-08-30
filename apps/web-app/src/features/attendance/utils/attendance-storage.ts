import type { AsistenciaViewMode } from '@restopsiq/ui';

const LOCATION_VIEW_MODE_KEY = 'restopsiq.attendance.locationViewMode';
const EMPLOYEE_VIEW_MODE_KEY = 'restopsiq.attendance.employeeViewMode';

export function getStoredLocationViewMode(): AsistenciaViewMode {
  const value = sessionStorage.getItem(LOCATION_VIEW_MODE_KEY);
  return value === 'list' || value === 'grid' ? value : 'list';
}

export function setStoredLocationViewMode(mode: AsistenciaViewMode): void {
  sessionStorage.setItem(LOCATION_VIEW_MODE_KEY, mode);
}

export function getStoredEmployeeViewMode(): AsistenciaViewMode {
  const value = sessionStorage.getItem(EMPLOYEE_VIEW_MODE_KEY);
  return value === 'list' || value === 'grid' ? value : 'list';
}

export function setStoredEmployeeViewMode(mode: AsistenciaViewMode): void {
  sessionStorage.setItem(EMPLOYEE_VIEW_MODE_KEY, mode);
}

export function getTodayIsoDateBogota(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
