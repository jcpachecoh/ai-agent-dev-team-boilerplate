import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authenticateOperatorPin, loginOperator, logoutOperator } from './auth.service';
import * as plantApi from './plant-api.service';

vi.mock('./plant-api.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./plant-api.service')>();
  return {
    ...actual,
    plantFetch: vi.fn(),
  };
});

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('authenticates with any cédula and PIN in demo mode without calling API', async () => {
    const result = await authenticateOperatorPin('EST-02', '12345678', '9999');
    expect(plantApi.plantFetch).not.toHaveBeenCalled();
    expect(result.operatorId).toBe('OP-DEMO-12345678');
    expect(result.operatorName).toBe('Operador 12345678');
  });

  it('calls API with cédula and PIN outside demo mode', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_ENABLE_DEMO_PIN', 'false');
    vi.mocked(plantApi.plantFetch).mockResolvedValueOnce({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      operator: {
        id: 'OP-001',
        name: 'Juan Pérez',
        role: 'OPERATOR',
        tenantId: 'palos-de-lena',
        sedeId: 'EST-02',
      },
    });
    const result = await authenticateOperatorPin('EST-02', '12345678', '5678');
    expect(plantApi.plantFetch).toHaveBeenCalledTimes(1);
    expect(result.operatorName).toBe('Juan Pérez');
    vi.unstubAllEnvs();
  });

  it('loginOperator calls MES auth API with cédula, PIN, station and tenant headers', async () => {
    vi.mocked(plantApi.plantFetch).mockResolvedValueOnce({
      accessToken: 'access-token',
      operator: {
        id: 'OP-001',
        role: 'OPERATOR',
        tenantId: 'palos-de-lena',
        sedeId: 'EST-02',
      },
    });

    await loginOperator({ stationId: 'EST-02', cedula: '12345678', pin: '5678' });

    expect(plantApi.plantFetch).toHaveBeenCalledWith('/api/mes/auth/login', {
      method: 'POST',
      headers: {
        'x-tenant-id': 'palos-de-lena',
        'x-station-id': 'EST-02',
      },
      body: JSON.stringify({ cedula: '12345678', pin: '5678' }),
    });
  });

  it('maps 401 API errors to a friendly auth error', async () => {
    vi.mocked(plantApi.plantFetch).mockRejectedValueOnce(
      new plantApi.PlantApiError(401, '/api/mes/auth/login'),
    );

    await expect(
      loginOperator({ stationId: 'EST-02', cedula: '12345678', pin: '9999' }),
    ).rejects.toThrow('Cédula o PIN incorrecto.');
  });

  it('logoutOperator calls MES auth logout with bearer token from plantFetch', async () => {
    vi.mocked(plantApi.plantFetch).mockResolvedValueOnce({ message: 'Logged out successfully.' });

    await logoutOperator();

    expect(plantApi.plantFetch).toHaveBeenCalledWith('/api/mes/auth/logout', {
      method: 'POST',
    });
  });

  it('logoutOperator swallows API errors and still resolves', async () => {
    vi.mocked(plantApi.plantFetch).mockRejectedValueOnce(
      new plantApi.PlantApiError(500, '/api/mes/auth/logout'),
    );

    await expect(logoutOperator()).resolves.toBeUndefined();
  });
});
