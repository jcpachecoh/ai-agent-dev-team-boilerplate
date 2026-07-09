import { describe, expect, it } from 'vitest';

import {
  LEAVE_ORIGIN_LABELS,
  LEAVE_STATUS_LABELS,
  MEDICAL_LEAVE_180_DAY_WARNING,
  buildMedicalLeaveMonthOptions,
  canMarkRecovered,
  canRadicateMedicalLeave,
  canRejectMedicalLeave,
  formatMedicalLeaveCurrency,
  getCurrentMonthValue,
} from './medical-leaves-display';

describe('medical-leaves-display', () => {
  it('expone etiquetas de origen y estado', () => {
    expect(LEAVE_ORIGIN_LABELS.COMUN).toBe('Enfermedad común');
    expect(LEAVE_STATUS_LABELS.RADICADA_EPS).toBe('Radicada EPS/ARL');
  });

  it('formatea montos en COP', () => {
    expect(formatMedicalLeaveCurrency(200000)).toContain('200');
  });

  it('expone el copy de alerta legal de 180 días', () => {
    expect(MEDICAL_LEAVE_180_DAY_WARNING).toContain('180 días acumulados');
  });

  it('genera opciones de mes con opción vacía inicial', () => {
    const options = buildMedicalLeaveMonthOptions(3);
    expect(options[0]?.value).toBe('');
    expect(options.length).toBeGreaterThan(1);
  });

  it('getCurrentMonthValue retorna YYYY-MM', () => {
    expect(getCurrentMonthValue()).toMatch(/^\d{4}-\d{2}$/);
  });

  it('define transiciones de acciones permitidas', () => {
    expect(canRadicateMedicalLeave('REGISTRADA', true)).toBe(true);
    expect(canRadicateMedicalLeave('REGISTRADA', false)).toBe(false);
    expect(canMarkRecovered('RADICADA_EPS')).toBe(true);
    expect(canRejectMedicalLeave('RECOBRADA')).toBe(false);
  });
});
