import { TurnoJornada, TurnoTipo } from '@prisma/client';

import type { TurnoRecord } from '../interfaces/turnos.interfaces';
import { startOfTodayUtc, toTurnoAuditJson } from '../turnos.utils';

const baseTurno: TurnoRecord = {
  id: 'turno-1',
  tenantId: 'tenant-1',
  locationId: 'loc-1',
  nombre: 'Turno mañana',
  sigla: 'TM',
  tipo: TurnoTipo.PERMANENTE,
  jornada: TurnoJornada.DIURNO,
  horaInicio: '06:00',
  horaFin: '14:00',
  daysOfWeek: [1, 2, 3, 4, 5],
  estado: true,
  createdByUserId: 'user-1',
  updatedByUserId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('turnos.utils', () => {
  describe('toTurnoAuditJson', () => {
    it('mapea campos auditables del turno', () => {
      expect(toTurnoAuditJson(baseTurno)).toEqual({
        locationId: 'loc-1',
        nombre: 'Turno mañana',
        sigla: 'TM',
        tipo: TurnoTipo.PERMANENTE,
        jornada: TurnoJornada.DIURNO,
        horaInicio: '06:00',
        horaFin: '14:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        estado: true,
      });
    });
  });

  describe('startOfTodayUtc', () => {
    it('retorna medianoche UTC del día actual', () => {
      const now = new Date();
      const expected = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );

      expect(startOfTodayUtc()).toEqual(expected);
    });
  });
});
