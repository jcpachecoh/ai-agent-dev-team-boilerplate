import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestQueryProvider, createTestQueryClient } from '@/test-utils/query-client';

import * as authApi from '../api/auth.api';
import { authKeys } from '../api/auth.keys';
import { useMe } from './useMe';

vi.mock('../api/auth.api', () => ({
  fetchCurrentUser: vi.fn(),
}));

vi.mock('@/lib/graphql-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/graphql-client')>();
  return {
    ...actual,
    isGraphqlConfigured: vi.fn(() => true),
  };
});

const mockProfile = {
  id: 'user-1',
  tenantId: 'palos-de-lena',
  email: 'mes-owner@palos-de-lena.dev',
  name: 'Propietario Principal',
  cedula: '1234567890',
  documentType: 'CC' as const,
  emailVerified: true,
  isActive: true,
  roleCode: 'OPERATOR',
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('useMe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and maps the current user profile', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useMe(), {
      wrapper: TestQueryProvider,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      id: 'user-1',
      tenantId: 'palos-de-lena',
      email: 'mes-owner@palos-de-lena.dev',
      displayName: 'Propietario Principal',
      displayRole: 'Operador',
      roleCode: 'OPERATOR',
    });
  });

  it('uses auth me query key', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(mockProfile);
    const client = createTestQueryClient();

    renderHook(() => useMe(), {
      wrapper: ({ children }) => <TestQueryProvider client={client}>{children}</TestQueryProvider>,
    });

    await waitFor(() => {
      expect(client.getQueryState(authKeys.me())?.status).toBe('success');
    });
  });
});
