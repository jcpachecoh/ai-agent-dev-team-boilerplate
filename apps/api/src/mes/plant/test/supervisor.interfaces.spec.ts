import { AlarmSeverity } from '@prisma/client';
import {
  mapAlarmSeverityToUi,
  mapEfficiencyStatus,
  mapPriorityToUi,
} from '../interfaces/supervisor.interfaces';

describe('supervisor.interfaces mappers', () => {
  describe('mapAlarmSeverityToUi', () => {
    it('maps CRITICAL to critico', () => {
      expect(mapAlarmSeverityToUi(AlarmSeverity.CRITICAL)).toBe('critico');
    });

    it('maps WARNING to alto', () => {
      expect(mapAlarmSeverityToUi(AlarmSeverity.WARNING)).toBe('alto');
    });

    it('maps INFO to medio', () => {
      expect(mapAlarmSeverityToUi(AlarmSeverity.INFO)).toBe('medio');
    });
  });

  describe('mapPriorityToUi', () => {
    it('maps HIGH to alta', () => {
      expect(mapPriorityToUi('HIGH')).toBe('alta');
    });

    it('maps URGENT to urgente', () => {
      expect(mapPriorityToUi('URGENT')).toBe('urgente');
    });

    it('maps NORMAL to normal', () => {
      expect(mapPriorityToUi('NORMAL')).toBe('normal');
    });
  });

  describe('mapEfficiencyStatus', () => {
    it('returns critical above 100%', () => {
      expect(mapEfficiencyStatus(101)).toBe('critical');
    });

    it('returns warning between 80% and 100%', () => {
      expect(mapEfficiencyStatus(80)).toBe('warning');
      expect(mapEfficiencyStatus(95)).toBe('warning');
    });

    it('returns normal below 80%', () => {
      expect(mapEfficiencyStatus(79)).toBe('normal');
    });
  });
});
