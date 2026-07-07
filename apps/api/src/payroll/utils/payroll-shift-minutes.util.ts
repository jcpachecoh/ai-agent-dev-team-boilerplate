/** SHIFT-UNI — ordinarias/extra vs. minutos objetivo del turno (NOM-07). */
export function splitPayrollMinutesAgainstTarget(
  workedMinutes: number,
  targetMinutes: number,
): { regularMinutes: number; overtimeMinutes: number } {
  const regularMinutes = Math.min(workedMinutes, targetMinutes);
  const overtimeMinutes = Math.max(0, workedMinutes - targetMinutes);
  return { regularMinutes, overtimeMinutes };
}
