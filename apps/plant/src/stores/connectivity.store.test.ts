import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useConnectivityStore } from './connectivity.store';

describe('connectivity.store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useConnectivityStore.getState().stopPingLoop();
    useConnectivityStore.setState({
      isOnline: true,
      lastPingAt: null,
      latencyMs: null,
      syncQueueCount: 0,
    });
  });

  afterEach(() => {
    useConnectivityStore.getState().stopPingLoop();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('marks offline when navigator is offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const ok = await useConnectivityStore.getState().ping();
    expect(ok).toBe(false);
    expect(useConnectivityStore.getState().isOnline).toBe(false);
  });

  it('ping succeeds when health returns ok', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
    } as Response);
    const ok = await useConnectivityStore.getState().ping();
    expect(ok).toBe(true);
    expect(useConnectivityStore.getState().latencyMs).not.toBeNull();
  });

  it('runs ping on interval when loop started', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);
    useConnectivityStore.getState().startPingLoop();
    vi.advanceTimersByTime(10_000);
    await vi.runOnlyPendingTimersAsync();
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
