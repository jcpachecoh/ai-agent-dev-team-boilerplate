import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestQueryProvider } from '@/test-utils/query-client';

import * as useMeHook from '@/features/auth/hooks/useMe';
import * as useAdminUsersHook from '../hooks/useAdminUsers';
import * as useAdminUserMutationsHook from '../hooks/useAdminUserMutations';
import type { AdminUserApi } from '../types';
import UsersListView from './UsersListView';

const mockUsers: AdminUserApi[] = [
  {
    id: 'user-1',
    tenantId: 'tenant-1',
    name: 'Juan Carlos Pérez',
    cedula: '12345678',
    documentType: 'CC',
    email: 'owner@test.dev',
    role: { id: 'role-1', code: 'OWNER', name: 'Propietario' },
    isActive: true,
    emailVerified: true,
    lastLoginAt: '2026-06-15T10:30:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-2',
    tenantId: 'tenant-1',
    name: 'María Operadora',
    cedula: '87654321',
    documentType: 'CC',
    email: 'operator@test.dev',
    role: { id: 'role-2', code: 'OPERATOR', name: 'Operador' },
    isActive: true,
    emailVerified: true,
    lastLoginAt: null,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

vi.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn(), setTheme: vi.fn() }),
}));

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: vi.fn(),
}));

vi.mock('../hooks/useAdminUsers', () => ({
  useAdminUsers: vi.fn(),
  useAdminRolesForSelect: vi.fn(),
}));

vi.mock('../hooks/useAdminUserMutations', () => ({
  useAdminCreateUser: vi.fn(),
  useAdminDeactivateUser: vi.fn(),
  useAdminUpdateUser: vi.fn(),
}));

function renderView(): void {
  render(
    <TestQueryProvider>
      <UsersListView />
    </TestQueryProvider>,
  );
}

describe('UsersListView', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useMeHook.useMe).mockReturnValue({
      data: {
        id: 'me-1',
        tenantId: 'tenant-1',
        email: 'owner@test.dev',
        displayName: 'Owner',
        displayRole: 'Propietario',
        roleCode: 'OWNER',
      },
    } as ReturnType<typeof useMeHook.useMe>);

    vi.mocked(useAdminUsersHook.useAdminUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useAdminUsersHook.useAdminUsers>);

    vi.mocked(useAdminUsersHook.useAdminRolesForSelect).mockReturnValue({
      data: [{ id: 'role-1', code: 'OWNER', name: 'Propietario', isActive: true }],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useAdminUsersHook.useAdminRolesForSelect>);

    vi.mocked(useAdminUserMutationsHook.useAdminCreateUser).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof useAdminUserMutationsHook.useAdminCreateUser>);

    vi.mocked(useAdminUserMutationsHook.useAdminUpdateUser).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof useAdminUserMutationsHook.useAdminUpdateUser>);

    vi.mocked(useAdminUserMutationsHook.useAdminDeactivateUser).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof useAdminUserMutationsHook.useAdminDeactivateUser>);
  });

  it('renders users from API', async () => {
    renderView();
    expect((await screen.findAllByText('owner@test.dev')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('operator@test.dev').length).toBeGreaterThanOrEqual(1);
  });

  it('filters users by search query', async () => {
    const user = userEvent.setup();
    renderView();
    await screen.findAllByText('owner@test.dev');

    await user.type(screen.getByPlaceholderText(/Buscar por email/i), 'operator');

    expect(screen.queryAllByText('owner@test.dev')).toHaveLength(0);
    expect(screen.getAllByText('operator@test.dev').length).toBeGreaterThanOrEqual(1);
  });
});
