import {
  RolActionButton,
  RolListToolbar,
  RolPage,
  RolPageHeader,
  RolPageSection,
  RolSplitLayout,
  RolTable,
  RolTableRow,
  toast,
} from '@restopsiq/ui';
import { useState, type JSX } from 'react';

import { useMe } from '@/features/auth/hooks/useMe';
import { getErrorMessage } from '@/lib/graphql-client';
import { useTheme } from '@/providers/ThemeProvider';

import { DeactivateRoleDialog } from '../components/DeactivateRoleDialog';
import { RoleFormModal } from '../components/RoleFormModal';
import { RolePermissionsPanel } from '../components/RolePermissionsPanel';
import {
  useAdminCreateRole,
  useAdminDeactivateRole,
  useAdminUpdateRole,
} from '../hooks/useAdminRoleMutations';
import { useAdminRoles } from '../hooks/useAdminRoles';
import type { AdminRole, CreateRoleFormValues, UpdateRoleFormValues } from '../types';
import styles from './RolesListView.module.scss';

export default function RolesListView(): JSX.Element {
  const { theme } = useTheme();
  const { data: me } = useMe();
  const rolesQuery = useAdminRoles();
  const createMutation = useAdminCreateRole();
  const updateMutation = useAdminUpdateRole();
  const deactivateMutation = useAdminDeactivateRole();

  const [selectedRole, setSelectedRole] = useState<AdminRole | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | undefined>();
  const [deactivatingRole, setDeactivatingRole] = useState<AdminRole | undefined>();

  const canManage = me?.roleCode === 'OWNER' || me?.roleCode === 'SUPERVISOR';
  const canAssignPermissions = me?.roleCode === 'OWNER';

  const roles = rolesQuery.data ?? [];

  const openCreate = () => {
    setEditingRole(undefined);
    setFormOpen(true);
  };

  const openEdit = (role: AdminRole) => {
    setEditingRole(role);
    setFormOpen(true);
  };

  const handleCreate = async (values: CreateRoleFormValues) => {
    try {
      const created = await createMutation.mutateAsync(values);
      toast.success(`Rol "${created.code}" creado correctamente.`);
      setFormOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleUpdate = async (values: UpdateRoleFormValues) => {
    if (!editingRole) {
      return;
    }
    try {
      const updated = await updateMutation.mutateAsync({ id: editingRole.id, input: values });
      toast.success(`Rol "${updated.code}" actualizado.`);
      setFormOpen(false);
      setEditingRole(undefined);
      if (selectedRole?.id === editingRole.id) {
        setSelectedRole(updated);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingRole) {
      return;
    }
    try {
      await deactivateMutation.mutateAsync(deactivatingRole.id);
      toast.success(`Rol "${deactivatingRole.code}" desactivado.`);
      setDeactivatingRole(undefined);
      if (selectedRole?.id === deactivatingRole.id) {
        setSelectedRole(undefined);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const toggleSelectedRole = (role: AdminRole) => {
    setSelectedRole((current) => (current?.id === role.id ? undefined : role));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <RolPage theme={theme} className={styles.screen}>
      <RolPageSection theme={theme} divider sticky variant="header">
        <RolPageHeader theme={theme} />
      </RolPageSection>

      <RolPageSection theme={theme} divider sticky variant="toolbar">
        <RolListToolbar
          count={roles.length}
          countLabel="roles"
          theme={theme}
          primaryAction={
            canManage ? <RolActionButton theme={theme} onClick={openCreate} /> : undefined
          }
        />
      </RolPageSection>

      <RolPageSection theme={theme} variant="body">
        {rolesQuery.isLoading ? (
          <div className={styles.loadingState}>Cargando roles…</div>
        ) : rolesQuery.isError ? (
          <div className={styles.loadingState}>Error al cargar roles.</div>
        ) : (
          <RolSplitLayout
            theme={theme}
            table={
              <div className={styles.tableWrap}>
                <RolTable
                  theme={theme}
                  showActions={canManage}
                  emptyState={<div className={styles.emptyState}>No hay roles registrados.</div>}
                >
                  {roles.map((role) => (
                    <RolTableRow
                      key={role.id}
                      id={role.id}
                      code={role.code}
                      name={role.name}
                      userCount={role.userCount}
                      permissionCount={role.permissionCount}
                      isActive={role.isActive}
                      selected={selectedRole?.id === role.id}
                      showActions={canManage}
                      theme={theme}
                      onSelect={() => toggleSelectedRole(role)}
                      onViewPermissions={() => toggleSelectedRole(role)}
                      onEdit={() => openEdit(role)}
                      onDeactivate={() => setDeactivatingRole(role)}
                    />
                  ))}
                </RolTable>
              </div>
            }
            panel={
              selectedRole ? (
                <RolePermissionsPanel
                  role={selectedRole}
                  canEdit={canAssignPermissions}
                  onClose={() => setSelectedRole(undefined)}
                />
              ) : undefined
            }
          />
        )}
      </RolPageSection>

      {editingRole ? (
        <RoleFormModal
          open={formOpen}
          mode="edit"
          role={editingRole}
          saving={isSaving}
          onClose={() => {
            setFormOpen(false);
            setEditingRole(undefined);
          }}
          onSave={(values) => void handleUpdate(values)}
        />
      ) : (
        <RoleFormModal
          open={formOpen}
          mode="create"
          saving={isSaving}
          onClose={() => setFormOpen(false)}
          onSave={(values) => void handleCreate(values)}
        />
      )}

      <DeactivateRoleDialog
        open={Boolean(deactivatingRole)}
        role={deactivatingRole}
        confirming={deactivateMutation.isPending}
        onClose={() => setDeactivatingRole(undefined)}
        onConfirm={() => void handleDeactivate()}
      />
    </RolPage>
  );
}
