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

  it('authenticates with demo PIN in dev without calling API', async () => {
    const result = await authenticateOperatorPin('EST-02', '1234');
    expect(plantApi.plantFetch).not.toHaveBeenCalled();
    expect(result.operatorName).toBe('Carlos Mendoza');
  });

  it('throws OperatorAuthError for wrong PIN in dev', async () => {
    await expect(authenticateOperatorPin('EST-02', '0000')).rejects.toBeInstanceOf(
      OperatorAuthError,
    );
    expect(plantApi.plantFetch).not.toHaveBeenCalled();
  });
});
