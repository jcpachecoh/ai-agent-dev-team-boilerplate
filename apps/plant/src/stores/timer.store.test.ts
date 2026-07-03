import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTimerStore } from './timer.store';

describe('timer.store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    useTimerStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts and increments elapsed time', () => {
    useTimerStore.getState().start();
    vi.advanceTimersByTime(3000);
    useTimerStore.getState().tick();
    expect(useTimerStore.getState().elapsedMs).toBeGreaterThanOrEqual(2000);
    expect(useTimerStore.getState().status).toBe('running');
  });

  it('pauses without clearing elapsed', () => {
    useTimerStore.getState().start();
    vi.advanceTimersByTime(2000);
    useTimerStore.getState().tick();
    const elapsed = useTimerStore.getState().elapsedMs;
    useTimerStore.getState().pause();
    vi.advanceTimersByTime(5000);
    expect(useTimerStore.getState().status).toBe('paused');
    expect(useTimerStore.getState().elapsedMs).toBe(elapsed);
  });

  it('hydrates from localStorage', () => {
    useTimerStore.getState().start();
    vi.advanceTimersByTime(1500);
    useTimerStore.getState().pause();
    const saved = useTimerStore.getState().elapsedMs;
    useTimerStore.setState({ elapsedMs: 0, status: 'idle' });
    useTimerStore.getState().hydrate();
    expect(useTimerStore.getState().elapsedMs).toBe(saved);
  });
});
