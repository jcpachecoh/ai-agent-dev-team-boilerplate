import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestQueryProvider, createTestQueryClient } from '@/test-utils/query-client';
import { setGraphqlAuthToken } from '@/lib/auth-token';

import * as authApi from '../api/auth.api';
import { proveedoresKeys } from '@/features/proveedores/api/proveedores.keys';

import { authKeys } from '../api/auth.keys';
import { LocationSessionProvider } from '../context/LocationSessionContext';
import { useLogin } from './useLogin';

vi.mock('../api/auth.api', () => ({
  loginWithEmailPassword: vi.fn(),
  fetchMyLocations: vi.fn().mockResolvedValue([]),
  selectUserLocation: vi.fn(),
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
  isAuthenticated: vi.fn(() => false),
  getLocationIdFromToken: vi.fn(() => null),
}));

const mockLoginResponse = {
  accessToken: 'jwt-test-token',
  refreshToken: 'refresh-test-token',
  locations: [],
  locationId: null,
  requiresLocationSelection: false,
};

function TestProviders({
  children,
  client,
}: {
  children: React.ReactNode;
  client: ReturnType<typeof createTestQueryClient>;
}) {
  return (
    <TestQueryProvider client={client}>
      <LocationSessionProvider>{children}</LocationSessionProvider>
    </TestQueryProvider>
  );
}

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores accessToken and invalidates auth queries on success', async () => {
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    vi.mocked(authApi.loginWithEmailPassword).mockResolvedValue(mockLoginResponse);

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useLogin({ onSuccess }), {
      wrapper: ({ children }) => <TestProviders client={client}>{children}</TestProviders>,
    });

    await result.current.mutateAsync({
      email: 'mes-owner@palos-de-lena.dev',
      password: 'TestPass123!',
    });

    expect(setGraphqlAuthToken).toHaveBeenCalledWith('jwt-test-token');
    expect(onSuccess).toHaveBeenCalledWith(mockLoginResponse);
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: authKeys.all });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: proveedoresKeys.all });
    });
  });

  it('surfaces API errors from loginWithEmailPassword', async () => {
    vi.mocked(authApi.loginWithEmailPassword).mockRejectedValue(
      new authApi.AuthApiError('Correo o contraseña incorrectos.', 401),
    );

    const { result } = renderHook(() => useLogin(), {
      wrapper: ({ children }) => (
        <TestProviders client={createTestQueryClient()}>{children}</TestProviders>
      ),
    });

    await expect(
      result.current.mutateAsync({ email: 'bad@example.com', password: 'wrong' }),
    ).rejects.toThrow('Correo o contraseña incorrectos.');

    expect(setGraphqlAuthToken).not.toHaveBeenCalled();
  });
});
