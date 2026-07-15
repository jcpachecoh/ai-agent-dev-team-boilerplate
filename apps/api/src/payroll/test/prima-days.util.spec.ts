import {
  previousPrimaHalf,
  resolvePrimaHalfForDate,
  resolvePrimaHalfWindow,
} from '../utils/prima-days.util';

describe('resolvePrimaHalfWindow', (): void => {
  it('primer semestre: [1-ene, 1-jul) UTC', (): void => {
    const { periodStart, periodEndExclusive } = resolvePrimaHalfWindow(2026, 'PRIMER_SEMESTRE');

    expect(periodStart.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(periodEndExclusive.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });

  it('segundo semestre: [1-jul, 1-ene del año siguiente) UTC', (): void => {
    const { periodStart, periodEndExclusive } = resolvePrimaHalfWindow(2026, 'SEGUNDO_SEMESTRE');

    expect(periodStart.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(periodEndExclusive.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });
});

describe('resolvePrimaHalfForDate', (): void => {
  it('clasifica una fecha de enero-junio como PRIMER_SEMESTRE', (): void => {
    expect(resolvePrimaHalfForDate(new Date('2026-03-15T00:00:00.000Z'))).toEqual({
      year: 2026,
      half: 'PRIMER_SEMESTRE',
    });
  });

  it('clasifica una fecha de julio-diciembre como SEGUNDO_SEMESTRE', (): void => {
    expect(resolvePrimaHalfForDate(new Date('2026-09-01T00:00:00.000Z'))).toEqual({
      year: 2026,
      half: 'SEGUNDO_SEMESTRE',
    });
  });

  it('el límite exacto del 1 de julio ya cuenta como SEGUNDO_SEMESTRE', (): void => {
    expect(resolvePrimaHalfForDate(new Date('2026-07-01T00:00:00.000Z')).half).toBe(
      'SEGUNDO_SEMESTRE',
    );
  });
});

describe('previousPrimaHalf', (): void => {
  it('el semestre anterior al segundo del mismo año es el primero', (): void => {
    expect(previousPrimaHalf(2026, 'SEGUNDO_SEMESTRE')).toEqual({
      year: 2026,
      half: 'PRIMER_SEMESTRE',
    });
  });

  it('el semestre anterior al primero de un año es el segundo del año anterior', (): void => {
    expect(previousPrimaHalf(2026, 'PRIMER_SEMESTRE')).toEqual({
      year: 2025,
      half: 'SEGUNDO_SEMESTRE',
    });
  });
});
