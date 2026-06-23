import {
  toast,
  UsuarioActionButton,
  UsuarioListToolbar,
  UsuarioPage,
  UsuarioPageHeader,
  UsuarioPageSection,
  UsuarioTable,
  UsuarioTableItem,
} from '@restopsiq/ui';
import { useMemo, useState, type JSX } from 'react';

import { useMe } from '@/features/auth/hooks/useMe';
import { useTheme } from '@/providers/ThemeProvider';
import { getErrorMessage } from '@/lib/graphql-client';

import styles from './UsersListView.module.scss';
import { DeactivateUserDialog } from '../components/DeactivateUserDialog/DeactivateUserDialog';
import { UserFormModal } from '../components/UserFormModal/UserFormModal';
import {
  useAdminCreateUser,
  useAdminDeactivateUser,
  useAdminUpdateUser,
} from '../hooks/useAdminUserMutations';
import { useAdminUsers, useAdminRolesForSelect } from '../hooks/useAdminUsers';
import { useLocations } from '../../sedes/hooks/useLocations';
import type { AdminUserApi, UserUpdateFormValues } from '../types';

const ADMIN_ROLE_CODES = new Set(['OWNER', 'SUPERVISOR']);

export default function UsersListView(): JSX.Element {
  const { theme } = useTheme();
  const usuarioTheme = theme === 'light' ? 'light' : 'dark';
  const { data: me } = useMe();

  const usersQuery = useAdminUsers();
  const rolesQuery = useAdminRolesForSelect();
  const locationsQuery = useLocations();
  const createMutation = useAdminCreateUser();
  const updateMutation = useAdminUpdateUser();
  const deactivateMutation = useAdminDeactivateUser();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserApi | undefined>();
  const [deactivating, setDeactivating] = useState<AdminUserApi | undefined>();

  const canManage =
    me?.roleCode !== null && me?.roleCode !== undefined && ADMIN_ROLE_CODES.has(me.roleCode);

  const users = usersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const locationOptions = (locationsQuery.data ?? [])
    .filter((l) => l.isActive)
    .map((l) => ({ id: l.id, name: l.name }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return users;
    }
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.cedula.includes(q) ||
        u.role.name.toLowerCase().includes(q),
    );
  }, [users, search]);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (user: AdminUserApi) => {
    setEditing(user);
    setFormOpen(true);
  };

  const handleCreate = async (values: Parameters<typeof createMutation.mutateAsync>[0]) => {
    try {
      const created = await createMutation.mutateAsync(values);
      toast.success(
        `Usuario ${created.email} creado. Se envió un correo de confirmación para configurar la contraseña.`,
      );
      setFormOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleUpdate = async (values: UserUpdateFormValues) => {
    if (!editing) {
      return;
    }
    try {
      const updated = await updateMutation.mutateAsync({ id: editing.id, input: values });
      toast.success(`Usuario ${updated.email} actualizado correctamente.`);
      setFormOpen(false);
      setEditing(undefined);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeactivate = async () => {
    if (!deactivating) {
      return;
    }
    try {
      await deactivateMutation.mutateAsync(deactivating.id);
      toast.success(`Usuario ${deactivating.email} desactivado.`);
      setDeactivating(undefined);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <UsuarioPage theme={usuarioTheme} className={styles.screen}>
      <UsuarioPageSection theme={usuarioTheme} divider variant="header">
        <UsuarioPageHeader
          title="Usuarios"
          subtitle="Gestión de cuentas de usuario y asignación de roles"
          theme={usuarioTheme}
          actions={
            canManage ? (
              <UsuarioActionButton theme={usuarioTheme} onClick={openCreate} />
            ) : undefined
          }
        />
      </UsuarioPageSection>

      <UsuarioPageSection theme={usuarioTheme} divider variant="toolbar">
        <UsuarioListToolbar
          count={filtered.length}
          searchValue={search}
          onSearchChange={setSearch}
          theme={usuarioTheme}
        />
      </UsuarioPageSection>

      <UsuarioPageSection theme={usuarioTheme} variant="body" className={styles.bodySection}>
        {usersQuery.isLoading ? (
          <div className={styles.state}>Cargando usuarios…</div>
        ) : usersQuery.isError ? (
          <div className={styles.state}>Error al cargar usuarios.</div>
        ) : filtered.length === 0 ? (
          <div className={styles.state}>No hay usuarios que coincidan con la búsqueda.</div>
        ) : (
          <UsuarioTable theme={usuarioTheme} showActions={canManage}>
            {filtered.map((user) => (
              <UsuarioTableItem
                key={user.id}
                id={user.id}
                name={user.name}
                email={user.email}
                cedula={user.cedula}
                documentType={user.documentType}
                roleName={user.role.name}
                roleCode={user.role.code}
                isActive={user.isActive}
                lastLoginAt={user.lastLoginAt}
                showActions={canManage}
                theme={usuarioTheme}
                onEdit={() => openEdit(user)}
                onDeactivate={() => setDeactivating(user)}
              />
            ))}
          </UsuarioTable>
        )}
      </UsuarioPageSection>

      {editing ? (
        <UserFormModal
          open={formOpen}
          mode="edit"
          initialValues={{ name: editing.name, email: editing.email, roleId: editing.role.id }}
          roles={roles}
          saving={isSaving}
          onClose={() => {
            setFormOpen(false);
            setEditing(undefined);
          }}
          onSave={(values) => void handleUpdate(values)}
        />
      ) : (
        <UserFormModal
          open={formOpen}
          mode="create"
          roles={roles}
          locations={locationOptions}
          saving={isSaving}
          onClose={() => setFormOpen(false)}
          onSave={(values) => void handleCreate(values)}
        />
      )}

      <DeactivateUserDialog
        open={Boolean(deactivating)}
        userEmail={deactivating?.email ?? ''}
        confirming={deactivateMutation.isPending}
        onClose={() => setDeactivating(undefined)}
        onConfirm={() => void handleDeactivate()}
      />
    </UsuarioPage>
  );
}
