import { describe, expect, it } from 'vitest';

import {
  formatMobileAttendanceEventType,
  formatMobileAttendanceStatus,
  formatRejectionReason,
  getDefaultMarcacionesDateRange,
  mapMobileAttendanceStatusToBadge,
} from './mobile-attendance-display';

describe('mobile-attendance-display', () => {
  it('traduce tipo de evento y estado', () => {
    expect(formatMobileAttendanceEventType('ENTRY')).toBe('Entrada');
    expect(formatMobileAttendanceStatus('VALID')).toBe('Válida');
  });

  it('traduce motivo de rechazo conocido', () => {
    expect(formatRejectionReason('OUTSIDE_RADIUS')).toBe('Fuera del radio permitido');
  });

  it('mapea estados a badges de UI', () => {
    expect(mapMobileAttendanceStatusToBadge('VALID')).toBe('APPROVED');
    expect(mapMobileAttendanceStatusToBadge('REJECTED')).toBe('REJECTED');
    expect(mapMobileAttendanceStatusToBadge('PENDING')).toBe('PENDING');
  });

  it('genera rango del mes actual', () => {
    const range = getDefaultMarcacionesDateRange();
    expect(range.dateFrom).toMatch(/^\d{4}-\d{2}-01$/);
    expect(range.dateTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
