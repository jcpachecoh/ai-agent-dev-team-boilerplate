import { describe, expect, it } from 'vitest';

import {
  buildAdminOvertimeWindowPayload,
  buildBogotaDateTimeIso,
  formatEstimatedDuration,
} from './admin-overtime-window';

describe('admin-overtime-window', () => {
  it('construye ISO Bogotá con offset -05:00', () => {
    expect(buildBogotaDateTimeIso('2026-07-16', '22:00')).toBe('2026-07-16T22:00:00.000-05:00');
  });

  it('soporta ventana same-day sin cruce de medianoche', () => {
    const result = buildAdminOvertimeWindowPayload({
      workDate: '2026-07-16',
      startTime: '18:00',
      endTime: '20:30',
    });

    expect(result.crossesMidnight).toBe(false);
    expect(result.proposedStartTime).toBe('2026-07-16T18:00:00.000-05:00');
    expect(result.proposedEndTime).toBe('2026-07-16T20:30:00.000-05:00');
    expect(result.estimatedMinutes).toBe(150);
  });

  it('soporta cruce de medianoche sin rechazar la ventana', () => {
    const result = buildAdminOvertimeWindowPayload({
      workDate: '2026-07-16',
      startTime: '22:00',
      endTime: '01:30',
    });

    expect(result.crossesMidnight).toBe(true);
    expect(result.proposedStartTime).toBe('2026-07-16T22:00:00.000-05:00');
    expect(result.proposedEndTime).toBe('2026-07-17T01:30:00.000-05:00');
    expect(result.estimatedMinutes).toBe(210);
  });

  it('formatea duración estimada solo como ayuda visual', () => {
    expect(formatEstimatedDuration(45)).toBe('45 min');
    expect(formatEstimatedDuration(120)).toBe('2 h');
    expect(formatEstimatedDuration(150)).toBe('2 h 30 min');
    expect(formatEstimatedDuration(0)).toBe('—');
  });
});
