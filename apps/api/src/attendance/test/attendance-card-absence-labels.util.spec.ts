import { LeaveOrigin, NovedadType } from '@prisma/client';

import {
  buildAttendanceCardAbsenceLabelMap,
  mapMedicalLeaveRangesToAbsenceRanges,
  mapPayrollNovedadRangesToAbsenceRanges,
  mergeAttendanceCardAbsenceLabelMaps,
} from '../utils/attendance-card-absence-labels.util';

describe('attendance-card-absence-labels.util', () => {
  const dateFrom = new Date('2026-06-10T00:00:00.000Z');
  const dateTo = new Date('2026-06-12T00:00:00.000Z');

  it('expande rangos de novedad a etiquetas por día', () => {
    const map = buildAttendanceCardAbsenceLabelMap(
      dateFrom,
      dateTo,
      mapPayrollNovedadRangesToAbsenceRanges([
        {
          startDate: new Date('2026-06-10T00:00:00.000Z'),
          endDate: new Date('2026-06-11T00:00:00.000Z'),
          type: NovedadType.LICENCIA_LUTO,
        },
      ]),
    );

    expect(map.get('2026-06-10')).toBe('Licencia de luto');
    expect(map.get('2026-06-11')).toBe('Licencia de luto');
    expect(map.get('2026-06-12')).toBeUndefined();
  });

  it('mapea incapacidades médicas a etiquetas legibles', () => {
    const map = buildAttendanceCardAbsenceLabelMap(
      dateFrom,
      dateTo,
      mapMedicalLeaveRangesToAbsenceRanges([
        {
          startDate: new Date('2026-06-10T00:00:00.000Z'),
          endDate: new Date('2026-06-10T00:00:00.000Z'),
          origin: LeaveOrigin.COMUN,
        },
      ]),
    );

    expect(map.get('2026-06-10')).toBe('Enfermedad común');
  });

  it('prioriza la última fuente al fusionar mapas', () => {
    const merged = mergeAttendanceCardAbsenceLabelMaps(
      buildAttendanceCardAbsenceLabelMap(
        dateFrom,
        dateTo,
        mapPayrollNovedadRangesToAbsenceRanges([
          {
            startDate: new Date('2026-06-10T00:00:00.000Z'),
            endDate: new Date('2026-06-10T00:00:00.000Z'),
            type: NovedadType.PERMISO_REMUNERADO,
          },
        ]),
      ),
      buildAttendanceCardAbsenceLabelMap(
        dateFrom,
        dateTo,
        mapMedicalLeaveRangesToAbsenceRanges([
          {
            startDate: new Date('2026-06-10T00:00:00.000Z'),
            endDate: new Date('2026-06-10T00:00:00.000Z'),
            origin: LeaveOrigin.LABORAL,
          },
        ]),
      ),
    );

    expect(merged.get('2026-06-10')).toBe('Accidente laboral');
  });
});
