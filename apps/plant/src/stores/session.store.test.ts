import { beforeEach, describe, expect, it } from 'vitest';
import { useSessionStore } from './session.store';

describe('session.store', () => {
  beforeEach(() => {
    useSessionStore.setState({
      stationId: null,
      operator: null,
      isAuthenticated: false,
      sessionStartedAt: null,
    });
  });

  it('sets stationId', () => {
    useSessionStore.getState().setStationId('EST-02');
    expect(useSessionStore.getState().stationId).toBe('EST-02');
  });

  it('login and logout', () => {
    useSessionStore.getState().login({ operatorId: 'op1', operatorName: 'Ana' });
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
    useSessionStore.getState().logout();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
    expect(useSessionStore.getState().operator).toBeNull();
  });
});
