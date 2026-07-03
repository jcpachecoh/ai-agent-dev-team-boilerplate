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
    useSessionStore.getState().login({
      operatorId: 'op1',
      operatorName: 'Ana',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      role: 'OPERATOR',
      tenantId: 'tenant-abc',
      locationId: 'loc-1',
      assignedLocations: [{ id: 'loc-1', name: 'Sede 1', code: 'PL-01', city: 'Bogotá' }],
      requiresLocationSelection: false,
    });
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
    expect(useSessionStore.getState().canOperate()).toBe(true);
    expect(useSessionStore.getState().operator?.accessToken).toBe('access-token');
    useSessionStore.getState().logout();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
    expect(useSessionStore.getState().operator).toBeNull();
  });
});
