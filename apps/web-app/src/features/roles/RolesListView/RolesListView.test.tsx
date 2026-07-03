import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestQueryProvider } from '@/test-utils/query-client';

import * as useMeHook from '@/features/auth/hooks/useMe';
import * as roleMutations from '../hooks/useAdminRoleMutations';
import type { AdminRole } from '../types';
import * as roleQueries from '../hooks/useAdminRoles';
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
  useAdminDuplicateRole: vi.fn(),
  useAdminCreatePermission: vi.fn(),
  useAdminUpdatePermission: vi.fn(),
  useAdminDeactivatePermission: vi.fn(),
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

    vi.mocked(roleMutations.useAdminDuplicateRole).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof roleMutations.useAdminDuplicateRole>);

    vi.mocked(roleMutations.useAdminCreatePermission).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof roleMutations.useAdminCreatePermission>);

    vi.mocked(roleMutations.useAdminUpdatePermission).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof roleMutations.useAdminUpdatePermission>);

    vi.mocked(roleMutations.useAdminDeactivatePermission).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof roleMutations.useAdminDeactivatePermission>);
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

  it('shows create action when roleCode is SUPER_ADMIN', async () => {
    vi.mocked(useMeHook.useMe).mockReturnValue({
      data: { roleCode: 'SUPER_ADMIN' },
    } as ReturnType<typeof useMeHook.useMe>);

    renderView();
    await screen.findByText('Propietario');

    expect(screen.getByRole('button', { name: 'Nuevo rol' })).toBeInTheDocument();
  });

  it('shows duplicate buttons for each role when roleCode is SUPER_ADMIN', async () => {
    vi.mocked(useMeHook.useMe).mockReturnValue({
      data: { roleCode: 'SUPER_ADMIN' },
    } as ReturnType<typeof useMeHook.useMe>);

    renderView();
    await screen.findByText('Propietario');

    const duplicateButtons = screen.getAllByRole('button', { name: /duplicar rol/i });
    expect(duplicateButtons).toHaveLength(2);
  });

  it('hides create action when roleCode is MANAGER', async () => {
    vi.mocked(useMeHook.useMe).mockReturnValue({
      data: { roleCode: 'MANAGER' },
    } as ReturnType<typeof useMeHook.useMe>);

    renderView();
    await screen.findByText('Propietario');

    expect(screen.queryByRole('button', { name: 'Nuevo rol' })).not.toBeInTheDocument();
  });

  it('shows duplicate button for each role when canManage', async () => {
    renderView();
    await screen.findByText('Propietario');

    const duplicateButtons = screen.getAllByRole('button', { name: /duplicar rol/i });
    expect(duplicateButtons).toHaveLength(2);
  });

  it('opens duplicate modal when duplicate button is clicked', async () => {
    const user = userEvent.setup();
    renderView();
    await screen.findByText('Propietario');

    const [firstDuplicateBtn] = screen.getAllByRole('button', { name: /duplicar rol/i });
    await user.click(firstDuplicateBtn);

    expect(screen.getByText(/duplicar rol/i)).toBeInTheDocument();
  });

  describe('permissions panel search', () => {
    // Permissions where code/name do NOT contain the term — only module/resource/action do.
    // This proves the extended search (module/resource/action) works.
    const catalogWithFields = [
      {
        id: 'p1',
        code: 'feature.x.y',
        name: 'Feature X Y',
        description: null,
        module: 'plant',
        resource: 'orders',
        action: 'read',
        isActive: true,
      },
      {
        id: 'p2',
        code: 'feature.a.b',
        name: 'Feature A B',
        description: null,
        module: 'admin',
        resource: 'users',
        action: 'manage',
        isActive: true,
      },
    ];

    beforeEach(() => {
      vi.mocked(roleQueries.usePermissionCatalog).mockReturnValue({
        data: catalogWithFields,
        isLoading: false,
      } as ReturnType<typeof roleQueries.usePermissionCatalog>);
    });

    it('filters by module field', async () => {
      const user = userEvent.setup();
      renderView();
      await screen.findByText('Propietario');
      await user.click(screen.getByText('Propietario'));

      const searchInput = screen.getByPlaceholderText('Buscar permiso…');
      await user.type(searchInput, 'plant');

      expect(screen.getByText('feature.x.y')).toBeInTheDocument();
      expect(screen.queryByText('feature.a.b')).not.toBeInTheDocument();
    });

    it('filters by resource field', async () => {
      const user = userEvent.setup();
      renderView();
      await screen.findByText('Propietario');
      await user.click(screen.getByText('Propietario'));

      const searchInput = screen.getByPlaceholderText('Buscar permiso…');
      await user.type(searchInput, 'orders');

      expect(screen.getByText('feature.x.y')).toBeInTheDocument();
      expect(screen.queryByText('feature.a.b')).not.toBeInTheDocument();
    });

    it('filters by action field', async () => {
      const user = userEvent.setup();
      renderView();
      await screen.findByText('Propietario');
      await user.click(screen.getByText('Propietario'));

      const searchInput = screen.getByPlaceholderText('Buscar permiso…');
      await user.type(searchInput, 'manage');

      expect(screen.queryByText('feature.x.y')).not.toBeInTheDocument();
      expect(screen.getByText('feature.a.b')).toBeInTheDocument();
    });
  });

  it('calls duplicate mutation when form is submitted', async () => {
    const mutateMock = vi.fn().mockResolvedValue({ code: 'OWNER_COPY', name: 'Copia' });
    vi.mocked(roleMutations.useAdminDuplicateRole).mockReturnValue({
      mutateAsync: mutateMock,
      isPending: false,
    } as unknown as ReturnType<typeof roleMutations.useAdminDuplicateRole>);

    const user = userEvent.setup();
    renderView();
    await screen.findByText('Propietario');

    const [firstDuplicateBtn] = screen.getAllByRole('button', { name: /duplicar rol/i });
    await user.click(firstDuplicateBtn);

    const codeInput = screen.getByPlaceholderText('Ej: NUEVO_ROL');
    await user.clear(codeInput);
    await user.type(codeInput, 'OWNER_COPY');

    const saveBtn = screen.getByRole('button', { name: /crear rol/i });
    await user.click(saveBtn);

    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 'role-1',
        input: expect.objectContaining({ code: 'OWNER_COPY' }),
      }),
    );
  });
});
