import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestQueryProvider } from '@/test-utils/query-client';

import * as useMeHook from '@/features/auth/hooks/useMe';
import * as roleMutations from '../hooks/useAdminRoleMutations';
import * as roleQueries from '../hooks/useAdminRoles';
import type { AdminRole } from '../types';
import RolesListView from './RolesListView';

const mockRoles: AdminRole[] = [
  {
    id: 'role-1',
    tenantId: 'tenant-1',
    code: 'OWNER',
    name: 'Propietario',
    description: null,
    isActive: true,
    userCount: 2,
    permissionCount: 10,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'role-2',
    tenantId: 'tenant-1',
    code: 'NOMINA',
    name: 'Nómina',
    description: null,
    isActive: true,
    userCount: 1,
    permissionCount: 4,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: vi.fn(),
}));

vi.mock('../hooks/useAdminRoles', () => ({
  useAdminRoles: vi.fn(),
  useAdminRoleDetail: vi.fn(),
  usePermissionCatalog: vi.fn(),
}));

vi.mock('../hooks/useAdminRoleMutations', () => ({
  useAdminCreateRole: vi.fn(),
  useAdminDeactivateRole: vi.fn(),
  useAdminUpdateRole: vi.fn(),
  useAdminAssignRolePermissions: vi.fn(),
}));

function renderView(): void {
  render(
    <TestQueryProvider>
      <RolesListView />
    </TestQueryProvider>,
  );
}

describe('RolesListView', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useMeHook.useMe).mockReturnValue({
      data: { roleCode: 'OWNER' },
    } as ReturnType<typeof useMeHook.useMe>);

    vi.mocked(roleQueries.useAdminRoles).mockReturnValue({
      data: mockRoles,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof roleQueries.useAdminRoles>);

    vi.mocked(roleQueries.useAdminRoleDetail).mockReturnValue({
      data: { ...mockRoles[0], permissions: [] },
      isLoading: false,
    } as ReturnType<typeof roleQueries.useAdminRoleDetail>);

    vi.mocked(roleQueries.usePermissionCatalog).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof roleQueries.usePermissionCatalog>);

    vi.mocked(roleMutations.useAdminCreateRole).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof roleMutations.useAdminCreateRole>);

    vi.mocked(roleMutations.useAdminUpdateRole).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof roleMutations.useAdminUpdateRole>);

    vi.mocked(roleMutations.useAdminDeactivateRole).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof roleMutations.useAdminDeactivateRole>);

    vi.mocked(roleMutations.useAdminAssignRolePermissions).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof roleMutations.useAdminAssignRolePermissions>);
  });

  it('renders roles from API', async () => {
    renderView();
    expect(await screen.findByText('Propietario')).toBeInTheDocument();
    expect(screen.getByText('Nómina')).toBeInTheDocument();
  });

  it('opens permissions panel when a role row is selected', async () => {
    const user = userEvent.setup();
    renderView();
    await screen.findByText('Propietario');

    await user.click(screen.getByText('Propietario'));

    expect(screen.getByLabelText('Permisos de Propietario')).toBeInTheDocument();
  });

  it('hides create action when user cannot manage roles', async () => {
    vi.mocked(useMeHook.useMe).mockReturnValue({
      data: { roleCode: 'OPERATOR' },
    } as ReturnType<typeof useMeHook.useMe>);

    renderView();
    await screen.findByText('Propietario');

    expect(screen.queryByRole('button', { name: 'Nuevo rol' })).not.toBeInTheDocument();
  });
});
