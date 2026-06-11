import { toast } from '@restopsiq/ui';
import { Pencil, Shield, UserX } from 'lucide-react';
import { useState, type JSX } from 'react';

import { useMe } from '@/features/auth/hooks/useMe';
import { getErrorMessage } from '@/lib/graphql-client';

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

const COL_TEMPLATE = '160px 1fr 80px 90px 100px 90px';

export default function RolesListView(): JSX.Element {
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

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const hasPanel = Boolean(selectedRole);

  return (
    <div className={styles.screen}>
      <div className={styles.stickyTop}>
        <header className={styles.pageHeader}>
          <h1>Roles</h1>
          <p>Gestión de roles y asignación de permisos por rol</p>
        </header>

        <div className={styles.toolbar}>
          <span className={styles.toolbarTitle}>
            {roles.length} rol{roles.length !== 1 ? 'es' : ''}
          </span>
          {canManage ? (
            <button type="button" className={styles.newBtn} onClick={openCreate}>
              + Nuevo rol
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.scrollBody}>
        {rolesQuery.isLoading ? (
          <div className={styles.loadingState}>Cargando roles…</div>
        ) : rolesQuery.isError ? (
          <div className={styles.loadingState}>Error al cargar roles.</div>
        ) : (
          <div className={`${styles.splitLayout} ${hasPanel ? '' : styles.splitLayoutFull}`}>
            <div className={`${styles.tablePane} ${hasPanel ? '' : styles.tablePaneFull}`}>
              <div className={styles.tableWrap}>
                <div
                  className={styles.tableHeader}
                  style={{ '--col-template': COL_TEMPLATE } as React.CSSProperties}
                  role="row"
                >
                  <span className={styles.colHead}>Código</span>
                  <span className={styles.colHead}>Nombre</span>
                  <span className={styles.colHead}>Usuarios</span>
                  <span className={styles.colHead}>Permisos</span>
                  <span className={styles.colHead}>Estado</span>
                  <span className={styles.colHead}>Acciones</span>
                </div>

                {roles.length === 0 ? (
                  <div className={styles.emptyState}>No hay roles registrados.</div>
                ) : (
                  roles.map((role) => {
                    const isSelected = selectedRole?.id === role.id;
                    return (
                      <div
                        key={role.id}
                        className={`${styles.tableRow} ${isSelected ? styles.tableRowSelected : ''}`}
                        style={{ '--col-template': COL_TEMPLATE } as React.CSSProperties}
                        role="row"
                        onClick={() => setSelectedRole(isSelected ? undefined : role)}
                      >
                        <span className={styles.cell}>
                          <span className={styles.codeChip}>{role.code}</span>
                        </span>
                        <span className={styles.cell}>{role.name}</span>
                        <span className={styles.cellMuted}>{role.userCount}</span>
                        <span className={styles.cellMuted}>{role.permissionCount}</span>
                        <span className={styles.cell}>
                          <span
                            className={role.isActive ? styles.badgeActive : styles.badgeInactive}
                          >
                            {role.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </span>
                        <span className={styles.actionsCell} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            title="Ver permisos"
                            onClick={() => setSelectedRole(isSelected ? undefined : role)}
                          >
                            <Shield size={13} aria-hidden />
                          </button>
                          {canManage ? (
                            <button
                              type="button"
                              className={styles.iconBtn}
                              title="Editar"
                              onClick={() => openEdit(role)}
                            >
                              <Pencil size={13} aria-hidden />
                            </button>
                          ) : null}
                          {canManage ? (
                            <button
                              type="button"
                              className={styles.iconBtnDanger}
                              title="Desactivar"
                              disabled={!role.isActive}
                              onClick={() => setDeactivatingRole(role)}
                            >
                              <UserX size={13} aria-hidden />
                            </button>
                          ) : null}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {hasPanel && selectedRole ? (
              <div className={styles.panelPane}>
                <RolePermissionsPanel
                  role={selectedRole}
                  canEdit={canAssignPermissions}
                  onClose={() => setSelectedRole(undefined)}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>

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
    </div>
  );
}
