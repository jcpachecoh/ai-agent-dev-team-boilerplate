export type TimerVisualState = 'on-time' | 'warning' | 'over';

export function formatElapsedMmSs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatStandardDurationMmSs(ms: number): string {
  return formatElapsedMmSs(ms);
}

export function getTimerProgress(elapsedMs: number, standardMs: number): number {
  if (standardMs <= 0) return 0;
  return Math.min(100, Math.round((elapsedMs / standardMs) * 100));
}

export function getTimerVisualState(elapsedMs: number, standardMs: number): TimerVisualState {
  if (standardMs <= 0) return 'on-time';
  const ratio = elapsedMs / standardMs;
  if (ratio >= 1) return 'over';
  if (ratio >= 0.8) return 'warning';
  return 'on-time';
}

export function getFieldStatusAccent(state: TimerVisualState): 'gold' | 'warning' | 'default' {
  if (state === 'warning') return 'warning';
  if (state === 'over') return 'warning';
  return 'gold';
}
