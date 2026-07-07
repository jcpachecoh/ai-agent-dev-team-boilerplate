import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getGraphqlAuthToken } from '@/lib/auth-token';

import { inventoryFetch } from './client';

vi.mock('@/lib/auth-token', () => ({
  getGraphqlAuthToken: vi.fn(),
}));

vi.mock('./config', () => ({
  inventoryApiConfig: { baseUrl: '', tenantId: 'palos-de-lena' },
}));

describe('inventoryFetch', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      }),
    );
    vi.mocked(getGraphqlAuthToken).mockReturnValue('session-jwt');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('sends Bearer token from graphql session storage', async () => {
    await inventoryFetch('/inventory/dashboard');

    expect(fetch).toHaveBeenCalledWith(
      '/api/inventory/dashboard',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer session-jwt',
          'x-tenant-id': 'palos-de-lena',
        }),
      }),
    );
  });
});
