import { getColombianHolidays, isColombianHoliday } from '../service/colombia-holidays.util';

describe('isColombianHoliday', () => {
  // ── Fixed holidays — same date every year ─────────────────────────────────

  describe('fixed holidays (inmovibles)', () => {
    it.each([
      ['2025-01-01', 'Año Nuevo 2025'],
      ['2025-05-01', 'Día del Trabajo 2025'],
      ['2025-07-20', 'Independencia 2025 (Sunday — still a holiday)'],
      ['2025-08-07', 'Batalla de Boyacá 2025'],
      ['2025-12-08', 'Inmaculada Concepción 2025'],
      ['2025-12-25', 'Navidad 2025'],
    ])('returns true for %s (%s)', (date) => {
      expect(isColombianHoliday(date)).toBe(true);
    });
  });

  // ── Easter-fixed (Jueves/Viernes Santo) ───────────────────────────────────

  describe('Easter-fixed holidays (Jueves/Viernes Santo)', () => {
    it('returns true for Jueves Santo 2025 (Apr 17)', () => {
      expect(isColombianHoliday('2025-04-17')).toBe(true);
    });

    it('returns true for Viernes Santo 2025 (Apr 18)', () => {
      expect(isColombianHoliday('2025-04-18')).toBe(true);
    });

    it('returns true for Jueves Santo 2026 (Apr 2)', () => {
      expect(isColombianHoliday('2026-04-02')).toBe(true);
    });

    it('returns true for Viernes Santo 2027 (Mar 25)', () => {
      expect(isColombianHoliday('2027-03-25')).toBe(true);
    });
  });

  // ── Movible holidays — Ley Emiliani shifted to Monday ─────────────────────

  describe('movible holidays (Ley Emiliani — shifted to Monday)', () => {
    it('2025-06-02: Ascensión (May 29 Thu → Jun 2 Mon)', () => {
      expect(isColombianHoliday('2025-06-02')).toBe(true);
    });

    it('2025-08-18: Asunción (Aug 15 Fri → Aug 18 Mon)', () => {
      expect(isColombianHoliday('2025-08-18')).toBe(true);
    });

    it('2025-10-13: Día de la Raza (Oct 12 Sun → Oct 13 Mon)', () => {
      expect(isColombianHoliday('2025-10-13')).toBe(true);
    });

    it('2025-11-17: Independencia de Cartagena (Nov 11 Tue → Nov 17 Mon)', () => {
      expect(isColombianHoliday('2025-11-17')).toBe(true);
    });

    it('2026-01-12: Reyes Magos (Jan 6 Tue → Jan 12 Mon)', () => {
      expect(isColombianHoliday('2026-01-12')).toBe(true);
    });

    it('2026-06-29: San Pedro y San Pablo (already Monday in 2026)', () => {
      expect(isColombianHoliday('2026-06-29')).toBe(true);
    });

    it('2027-07-05: San Pedro y San Pablo (Jun 29 Tue → Jul 5 Mon)', () => {
      expect(isColombianHoliday('2027-07-05')).toBe(true);
    });

    it('2027-11-01: Todos los Santos (already Monday in 2027)', () => {
      expect(isColombianHoliday('2027-11-01')).toBe(true);
    });
  });

  // ── Non-holidays ─────────────────────────────────────────────────────────

  describe('non-holiday dates return false', () => {
    it.each([
      ['2025-01-02', 'day after Año Nuevo'],
      ['2025-04-19', 'day after Viernes Santo'],
      ['2025-07-19', 'day before Independencia'],
      ['2025-07-21', 'day after Independencia'],
      ['2025-08-15', 'original Asunción date (moved to Aug 18 in 2025)'],
      ['2025-11-11', 'original Cartagena date (moved to Nov 17 in 2025)'],
      ['2026-01-06', 'original Reyes Magos date (moved to Jan 12 in 2026)'],
      ['2026-10-13', 'Oct 13 (Raza is Oct 12 in 2026, not Oct 13)'],
      ['2027-06-29', 'Jun 29 (San Pedro moved to Jul 5 in 2027)'],
    ])('returns false for %s (%s)', (date) => {
      expect(isColombianHoliday(date)).toBe(false);
    });
  });

  // ── Accepts Date objects ──────────────────────────────────────────────────

  describe('accepts Date objects', () => {
    it('returns true for Date("2025-08-07T00:00:00.000Z") — UTC midnight', () => {
      expect(isColombianHoliday(new Date('2025-08-07T00:00:00.000Z'))).toBe(true);
    });

    it('returns false for Date("2025-08-08T00:00:00.000Z")', () => {
      expect(isColombianHoliday(new Date('2025-08-08T00:00:00.000Z'))).toBe(false);
    });
  });

  // ── Unknown year ─────────────────────────────────────────────────────────

  it('returns false for a year not yet in the hardcoded calendar (2028)', () => {
    expect(isColombianHoliday('2028-01-01')).toBe(false);
  });
});

// ── getColombianHolidays ───────────────────────────────────────────────────

describe('getColombianHolidays', () => {
  it('returns 17 holidays for 2025', () => {
    expect(getColombianHolidays(2025)).toHaveLength(17);
  });

  it('returns 18 holidays for 2026', () => {
    expect(getColombianHolidays(2026)).toHaveLength(18);
  });

  it('returns 18 holidays for 2027', () => {
    expect(getColombianHolidays(2027)).toHaveLength(18);
  });

  it('returns an empty array for unknown year', () => {
    expect(getColombianHolidays(2028)).toEqual([]);
  });

  it('all dates are valid YYYY-MM-DD strings', () => {
    const pattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    for (const year of [2025, 2026, 2027]) {
      for (const date of getColombianHolidays(year)) {
        expect(date).toMatch(pattern);
      }
    }
  });

  it('all dates within the correct year', () => {
    for (const year of [2025, 2026, 2027]) {
      for (const date of getColombianHolidays(year)) {
        expect(date.startsWith(String(year))).toBe(true);
      }
    }
  });

  it('returned array is a copy (mutating it does not affect the module)', () => {
    // Arrange
    const holidays = getColombianHolidays(2025);
    const originalLength = holidays.length;

    // Act
    holidays.push('2025-99-99');

    // Assert — re-fetching returns original length
    expect(getColombianHolidays(2025)).toHaveLength(originalLength);
  });
});
