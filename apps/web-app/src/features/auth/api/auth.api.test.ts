import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthApiError, loginWithCedulaPin } from './auth.api';

describe('loginWithCedulaPin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs cedula and pin to MES login', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          login: {
            token: 'token-abc',
            user: { id: '1', role: 'MANAGER', tenantId: 'palos-de-lena', isActive: true },
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await loginWithCedulaPin({ cedula: '1234567890', pin: '1234' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/graphql'),
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(result.token).toBe('token-abc');
  });

  it('throws AuthApiError on 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      }),
    );

    await expect(loginWithCedulaPin({ cedula: '1234567890', pin: '0000' })).rejects.toBeInstanceOf(
      AuthApiError,
    );
  });
});
