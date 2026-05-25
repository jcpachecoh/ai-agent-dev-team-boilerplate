import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authenticateOperatorPin, OperatorAuthError } from './auth.service';
import * as plantApi from './plant-api.service';

vi.mock('./plant-api.service', () => ({
  plantFetch: vi.fn(),
}));

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
      operatorId: 'OP-001',
      operatorName: 'Juan Pérez',
    });
    const result = await authenticateOperatorPin('EST-02', '12345678', '5678');
    expect(plantApi.plantFetch).toHaveBeenCalledTimes(1);
    expect(result.operatorName).toBe('Juan Pérez');
    vi.unstubAllEnvs();
  });
});
