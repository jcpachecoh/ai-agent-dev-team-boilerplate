import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestQueryProvider, createTestQueryClient } from '@/test-utils/query-client';
import { setGraphqlAuthToken } from '@/lib/auth-token';

import * as authApi from '../api/auth.api';
import { proveedoresKeys } from '@/features/proveedores/api/proveedores.keys';

import { authKeys } from '../api/auth.keys';
import { useLogin } from './useLogin';

vi.mock('../api/auth.api', () => ({
  loginWithCedulaPin: vi.fn(),
  AuthApiError: class AuthApiError extends Error {
    constructor(
      message: string,
      public readonly status?: number,
    ) {
      super(message);
      this.name = 'AuthApiError';
    }
  },
}));

vi.mock('@/lib/auth-token', () => ({
  setGraphqlAuthToken: vi.fn(),
  getGraphqlAuthToken: vi.fn(),
  clearGraphqlAuthToken: vi.fn(),
}));

const mockLoginResponse = {
  accessToken: 'jwt-test-token',
  operator: {
    id: 'op-1',
    name: 'Test Operator',
    role: 'MANAGER',
    tenantId: 'palos-de-lena',
  },
};

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores token and invalidates auth queries on success', async () => {
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    vi.mocked(authApi.loginWithCedulaPin).mockResolvedValue(mockLoginResponse);

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useLogin({ onSuccess }), {
      wrapper: ({ children }) => <TestQueryProvider client={client}>{children}</TestQueryProvider>,
    });

    await result.current.mutateAsync({ cedula: '1234567890', pin: '1234' });

    expect(setGraphqlAuthToken).toHaveBeenCalledWith('jwt-test-token');
    expect(onSuccess).toHaveBeenCalledWith(mockLoginResponse);
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: authKeys.all });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: proveedoresKeys.all });
    });
  });

  it('surfaces API errors from loginWithCedulaPin', async () => {
    vi.mocked(authApi.loginWithCedulaPin).mockRejectedValue(
      new authApi.AuthApiError('Cédula o PIN incorrecto.', 401),
    );

    const { result } = renderHook(() => useLogin(), {
      wrapper: TestQueryProvider,
    });

    await expect(result.current.mutateAsync({ cedula: '1234567890', pin: '0000' })).rejects.toThrow(
      'Cédula o PIN incorrecto.',
    );

    expect(setGraphqlAuthToken).not.toHaveBeenCalled();
  });
});
