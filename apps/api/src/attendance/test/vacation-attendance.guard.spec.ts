import { VacationType } from '@prisma/client';

import {
  buildVacationDateKeySet,
  countApprovedVacationDaysInRange,
  isDateWithinApprovedVacation,
} from '../service/vacation-attendance.guard';

describe('vacation-attendance.guard helpers', () => {
  const ranges = [
    {
      employeeId: 'emp-1',
      startDate: new Date('2026-07-10T00:00:00.000Z'),
      endDate: new Date('2026-07-12T00:00:00.000Z'),
      type: VacationType.DISFRUTE,
    },
  ];

  it('isDateWithinApprovedVacation detecta día dentro del rango', () => {
    expect(isDateWithinApprovedVacation(ranges, new Date('2026-07-11T00:00:00.000Z'))).toBe(true);
    expect(isDateWithinApprovedVacation(ranges, new Date('2026-07-09T00:00:00.000Z'))).toBe(false);
  });

  it('countApprovedVacationDaysInRange cuenta días inclusivos', () => {
    const count = countApprovedVacationDaysInRange(
      ranges,
      new Date('2026-07-01T00:00:00.000Z'),
      new Date('2026-07-31T00:00:00.000Z'),
    );
    expect(count).toBe(3);
  });

  it('buildVacationDateKeySet genera claves YYYY-MM-DD', () => {
    const keys = buildVacationDateKeySet(
      ranges,
      new Date('2026-07-01T00:00:00.000Z'),
      new Date('2026-07-31T00:00:00.000Z'),
    );
    expect(keys.has('2026-07-10')).toBe(true);
    expect(keys.has('2026-07-12')).toBe(true);
    expect(keys.size).toBe(3);
  });
});
