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
        accessToken: 'token-abc',
        operator: { id: '1', role: 'MANAGER', tenantId: 'palos-de-lena' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await loginWithCedulaPin({ cedula: '1234567890', pin: '1234' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/mes/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-tenant-id': expect.any(String),
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ cedula: '1234567890', pin: '1234' }),
      }),
    );
    expect(result.accessToken).toBe('token-abc');
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
