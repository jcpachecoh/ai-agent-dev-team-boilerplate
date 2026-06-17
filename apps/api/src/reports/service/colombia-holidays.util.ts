/**
 * Colombian public holiday calendar — MVP hardcoded implementation.
 *
 * Legal basis:
 *   - Ley 51/1983 (Ley Emiliani): defines which holidays are fixed (inmovibles)
 *     and which move to the next Monday (movibles).
 *   - Ley 1185/2008: adds Día del Idioma (Apr 23) — omitted here as it only
 *     applies to public sector; private sector payroll follows Ley 51/1983.
 *   - Ley 100/1993 + Decreto 1833/2016: pension holiday computation rules.
 *
 * Fixed holidays (always on the calendar date, no Monday shift):
 *   Jan 1, May 1, Jul 20, Aug 7, Dec 8, Dec 25,
 *   Jueves Santo, Viernes Santo (Easter-dependent)
 *
 * Movible holidays (move to next Monday if not already Monday):
 *   Jan 6, Mar 19, Ascensión (E+39), Corpus Christi (E+60),
 *   Sagrado Corazón (E+68), Jun 29, Aug 15, Oct 12, Nov 1, Nov 11
 *
 * MAINTENANCE: Add next year every December before January deployment.
 *   Source for verification: https://www.mintrabajo.gov.co (calendar section)
 *   Easter algorithm: Butcher/Meeus (first Sunday after first full moon after Mar 21)
 */

const COLOMBIAN_HOLIDAYS_BY_YEAR: Readonly<Record<number, readonly string[]>> = {
  // ── 2025 ── Easter: Apr 20
  // E+39=May 29 Thu→Jun 2 Mon | E+60=Jun 19 Thu→Jun 23 Mon | E+68=Jun 27 Fri→Jun 30 Mon
  // Jun 29 Sun→Jun 30 Mon (same date as Sagrado Corazón: deduplicated)
  2025: [
    '2025-01-01', // Año Nuevo (fixed)
    '2025-01-06', // Reyes Magos (already Monday)
    '2025-03-24', // San José (Mar 19 Wed → Mar 24 Mon)
    '2025-04-17', // Jueves Santo (fixed)
    '2025-04-18', // Viernes Santo (fixed)
    '2025-05-01', // Día del Trabajo (fixed)
    '2025-06-02', // Ascensión (May 29 Thu → Jun 2 Mon)
    '2025-06-23', // Corpus Christi (Jun 19 Thu → Jun 23 Mon)
    '2025-06-30', // Sagrado Corazón (Jun 27 Fri → Jun 30) + San Pedro y San Pablo (Jun 29 Sun → Jun 30)
    '2025-07-20', // Independencia (fixed)
    '2025-08-07', // Batalla de Boyacá (fixed)
    '2025-08-18', // Asunción de la Virgen (Aug 15 Fri → Aug 18 Mon)
    '2025-10-13', // Día de la Raza (Oct 12 Sun → Oct 13 Mon)
    '2025-11-03', // Todos los Santos (Nov 1 Sat → Nov 3 Mon)
    '2025-11-17', // Independencia de Cartagena (Nov 11 Tue → Nov 17 Mon)
    '2025-12-08', // Inmaculada Concepción (fixed)
    '2025-12-25', // Navidad (fixed)
  ],

  // ── 2026 ── Easter: Apr 5
  // E+39=May 14 Thu→May 18 Mon | E+60=Jun 4 Thu→Jun 8 Mon | E+68=Jun 12 Fri→Jun 15 Mon
  2026: [
    '2026-01-01', // Año Nuevo (fixed)
    '2026-01-12', // Reyes Magos (Jan 6 Tue → Jan 12 Mon)
    '2026-03-23', // San José (Mar 19 Thu → Mar 23 Mon)
    '2026-04-02', // Jueves Santo (fixed)
    '2026-04-03', // Viernes Santo (fixed)
    '2026-05-01', // Día del Trabajo (fixed)
    '2026-05-18', // Ascensión (May 14 Thu → May 18 Mon)
    '2026-06-08', // Corpus Christi (Jun 4 Thu → Jun 8 Mon)
    '2026-06-15', // Sagrado Corazón (Jun 12 Fri → Jun 15 Mon)
    '2026-06-29', // San Pedro y San Pablo (already Monday)
    '2026-07-20', // Independencia (fixed — Monday)
    '2026-08-07', // Batalla de Boyacá (fixed)
    '2026-08-17', // Asunción de la Virgen (Aug 15 Sat → Aug 17 Mon)
    '2026-10-12', // Día de la Raza (already Monday)
    '2026-11-02', // Todos los Santos (Nov 1 Sun → Nov 2 Mon)
    '2026-11-16', // Independencia de Cartagena (Nov 11 Wed → Nov 16 Mon)
    '2026-12-08', // Inmaculada Concepción (fixed)
    '2026-12-25', // Navidad (fixed)
  ],

  // ── 2027 ── Easter: Mar 28
  // E+39=May 6 Thu→May 10 Mon | E+60=May 27 Thu→May 31 Mon | E+68=Jun 4 Fri→Jun 7 Mon
  2027: [
    '2027-01-01', // Año Nuevo (fixed)
    '2027-01-11', // Reyes Magos (Jan 6 Wed → Jan 11 Mon)
    '2027-03-22', // San José (Mar 19 Fri → Mar 22 Mon)
    '2027-03-25', // Jueves Santo (fixed)
    '2027-03-26', // Viernes Santo (fixed)
    '2027-05-01', // Día del Trabajo (fixed)
    '2027-05-10', // Ascensión (May 6 Thu → May 10 Mon)
    '2027-05-31', // Corpus Christi (May 27 Thu → May 31 Mon)
    '2027-06-07', // Sagrado Corazón (Jun 4 Fri → Jun 7 Mon)
    '2027-07-05', // San Pedro y San Pablo (Jun 29 Tue → Jul 5 Mon)
    '2027-07-20', // Independencia (fixed)
    '2027-08-07', // Batalla de Boyacá (fixed)
    '2027-08-16', // Asunción de la Virgen (Aug 15 Sun → Aug 16 Mon)
    '2027-10-18', // Día de la Raza (Oct 12 Tue → Oct 18 Mon)
    '2027-11-01', // Todos los Santos (already Monday)
    '2027-11-15', // Independencia de Cartagena (Nov 11 Thu → Nov 15 Mon)
    '2027-12-08', // Inmaculada Concepción (fixed)
    '2027-12-25', // Navidad (fixed)
  ],
};

// Precomputed Sets for O(1) lookup
const HOLIDAY_SETS = new Map<number, Set<string>>(
  (Object.entries(COLOMBIAN_HOLIDAYS_BY_YEAR) as [string, readonly string[]][]).map(
    ([year, dates]) => [Number(year), new Set(dates)],
  ),
);

/**
 * Returns all Colombian public holiday dates for the given year as YYYY-MM-DD strings.
 * Returns an empty array for years not yet hardcoded in this file.
 */
export function getColombianHolidays(year: number): string[] {
  return [...(COLOMBIAN_HOLIDAYS_BY_YEAR[year] ?? [])];
}

/**
 * Returns true if the given date is a Colombian public holiday.
 * Accepts either a Date object (uses UTC date, since workDates are stored as UTC midnight)
 * or a YYYY-MM-DD string directly.
 * Returns false for years not yet in the hardcoded calendar.
 */
export function isColombianHoliday(date: Date | string): boolean {
  const dateStr = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  const year = Number(dateStr.slice(0, 4));
  return HOLIDAY_SETS.get(year)?.has(dateStr) ?? false;
}

/**
 * Returns the maximum weekly working minutes (total jornada) under Ley 2101/2021.
 *
 * Schedule per Ley 2101/2021 (progressive reduction):
 *   ≤2025 → 46h (2760 min)
 *   2026  → 44h (2640 min)
 *   2027+ → 42h (2520 min)
 *
 * IMPORTANT — two separate weekly limits exist; this function covers only one of them:
 *   • Total jornada cap (THIS function) — Ley 2101/2021: total hours worked per week.
 *   • Overtime-only cap (WEEKLY_OVERTIME_LIMIT_MINUTES = 720 min) — CST art. 168:
 *     maximum 12h of extra hours per week on top of ordinary schedule.
 *     That cap is enforced separately in checkExceededOvertimeLimit (reports.service.ts)
 *     and must NOT be replaced by this function.
 *
 * Currently unused by NOM-04 MVP; reserved for future weekly working-time alert
 * (e.g., an attendanceReport field "exceededMaxJornada" based on total minutes worked per week).
 */
export function getMaxWeeklyMinutesForYear(year: number): number {
  if (year <= 2025) return 46 * 60; // 2760
  if (year === 2026) return 44 * 60; // 2640
  return 42 * 60; // 2520 — 2027+
}
