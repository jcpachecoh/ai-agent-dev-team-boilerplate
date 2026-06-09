import { describe, expect, it } from 'vitest';

import {
  formatElapsedMmSs,
  getFieldStatusAccent,
  getTimerProgress,
  getTimerVisualState,
} from './phase-timer';

const STANDARD_MS = 15 * 60 * 1000;

describe('phase-timer', () => {
  it('formats elapsed as mm:ss', () => {
    expect(formatElapsedMmSs(765_000)).toBe('12:45');
    expect(formatElapsedMmSs(0)).toBe('00:00');
  });

  it('maps visual state at 80% and 100% thresholds', () => {
    expect(getTimerVisualState(STANDARD_MS * 0.79, STANDARD_MS)).toBe('on-time');
    expect(getTimerVisualState(STANDARD_MS * 0.8, STANDARD_MS)).toBe('warning');
    expect(getTimerVisualState(STANDARD_MS, STANDARD_MS)).toBe('over');
  });

  it('computes progress capped at 100', () => {
    expect(getTimerProgress(STANDARD_MS * 0.85, STANDARD_MS)).toBe(85);
    expect(getTimerProgress(STANDARD_MS * 1.2, STANDARD_MS)).toBe(100);
  });

  it('selects FieldStatusCard accent from visual state', () => {
    expect(getFieldStatusAccent('on-time')).toBe('gold');
    expect(getFieldStatusAccent('warning')).toBe('warning');
    expect(getFieldStatusAccent('over')).toBe('warning');
  });
});
