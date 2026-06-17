import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GraphqlRequestError } from '@/lib/graphql-client';

import {
  AuthApiError,
  fetchCurrentUser,
  loginWithEmailPassword,
  logoutGlobalUser,
  signupWithEmailPassword,
} from './auth.api';

const graphqlRequestMock = vi.fn();

vi.mock('@/lib/graphql-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/graphql-client')>();
  return {
    ...actual,
    graphqlRequest: (...args: unknown[]) => graphqlRequestMock(...args),
  };
});

describe('loginWithEmailPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GraphQL login mutation with GlobalLoginInput', async () => {
    graphqlRequestMock.mockResolvedValue({
      login: { accessToken: 'access-abc', refreshToken: 'refresh-xyz' },
    });

    const result = await loginWithEmailPassword({
      email: 'mes-owner@palos-de-lena.dev',
      password: 'TestPass123!',
    });

    expect(graphqlRequestMock).toHaveBeenCalledWith(expect.stringContaining('mutation Login'), {
      input: {
        email: 'mes-owner@palos-de-lena.dev',
        password: 'TestPass123!',
      },
    });
    expect(result.accessToken).toBe('access-abc');
  });

  it('throws AuthApiError on UNAUTHENTICATED', async () => {
    graphqlRequestMock.mockRejectedValue(
      new GraphqlRequestError('Invalid credentials', 'UNAUTHENTICATED'),
    );

    await expect(
      loginWithEmailPassword({ email: 'bad@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({
      message: 'Correo o contraseña incorrectos.',
      status: 401,
    });
  });
});

describe('signupWithEmailPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GraphQL signup mutation with SignupInput', async () => {
    graphqlRequestMock.mockResolvedValue({
      signup: { accessToken: 'access-abc', refreshToken: 'refresh-xyz' },
    });

    const result = await signupWithEmailPassword({
      email: 'new-user@palos-de-lena.dev',
      cedula: '1234567890',
      documentType: 'CC',
      password: 'TestPass123!',
    });

    expect(graphqlRequestMock).toHaveBeenCalledWith(expect.stringContaining('mutation Signup'), {
      input: {
        email: 'new-user@palos-de-lena.dev',
        cedula: '1234567890',
        documentType: 'CC',
        password: 'TestPass123!',
      },
    });
    expect(result.accessToken).toBe('access-abc');
  });

  it('throws AuthApiError on CONFLICT', async () => {
    graphqlRequestMock.mockRejectedValue(
      new GraphqlRequestError('Email already registered', 'CONFLICT'),
    );

    await expect(
      signupWithEmailPassword({
        email: 'existing@example.com',
        cedula: '1234567890',
        documentType: 'CC',
        password: 'TestPass123!',
      }),
    ).rejects.toMatchObject({
      message: 'Correo o cédula ya registrados.',
      status: 409,
    });
  });
});

describe('fetchCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GraphQL me query', async () => {
    const profile = {
      id: 'user-1',
      tenantId: 'palos-de-lena',
      email: 'mes-owner@palos-de-lena.dev',
      cedula: '1234567890',
      documentType: 'CC' as const,
      emailVerified: true,
      isActive: true,
      roleCode: 'OPERATOR',
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    graphqlRequestMock.mockResolvedValue({ me: profile });

    const result = await fetchCurrentUser();

    expect(graphqlRequestMock).toHaveBeenCalledWith(expect.stringContaining('query Me'));
    expect(result).toEqual(profile);
  });

  it('throws AuthApiError on UNAUTHENTICATED', async () => {
    graphqlRequestMock.mockRejectedValue(
      new GraphqlRequestError('Unauthorized', 'UNAUTHENTICATED'),
    );

    await expect(fetchCurrentUser()).rejects.toMatchObject({
      message: 'Sesión expirada. Inicia sesión de nuevo.',
      status: 401,
    });
  });
});

describe('logoutGlobalUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GraphQL logout mutation', async () => {
    graphqlRequestMock.mockResolvedValue({ logout: true });

    await logoutGlobalUser();

    expect(graphqlRequestMock).toHaveBeenCalledWith(expect.stringContaining('mutation Logout'));
  });

  it('throws AuthApiError when logout fails', async () => {
    graphqlRequestMock.mockRejectedValue(
      new GraphqlRequestError('Unauthorized', 'UNAUTHENTICATED'),
    );

    await expect(logoutGlobalUser()).rejects.toBeInstanceOf(AuthApiError);
  });
});
