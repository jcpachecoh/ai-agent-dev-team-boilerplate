import { toast } from '@restopsiq/ui';
import { Pencil, UserX } from 'lucide-react';
import { useMemo, useState, type JSX } from 'react';

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
import type { AdminUserApi, UserUpdateFormValues } from '../types';

const COL_TEMPLATE = '1fr 1.4fr 100px 120px 130px 110px 80px';

function formatDate(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function UsersListView(): JSX.Element {
  const usersQuery = useAdminUsers();
  const rolesQuery = useAdminRolesForSelect();
  const createMutation = useAdminCreateUser();
  const updateMutation = useAdminUpdateUser();
  const deactivateMutation = useAdminDeactivateUser();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserApi | undefined>();
  const [deactivating, setDeactivating] = useState<AdminUserApi | undefined>();

  const users = usersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return users;
    }
    return users.filter(
      (u) =>
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
      toast.success(`Usuario ${created.email} creado. Contraseña temporal enviada por correo.`);
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
    <div className={styles.screen}>
      <div className={styles.stickyTop}>
        <header className={styles.pageHeader}>
          <h1>Usuarios</h1>
          <p>Gestión de cuentas de usuario y asignación de roles</p>
        </header>

        <div className={styles.toolbar}>
          <span className={styles.toolbarTitle}>
            {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
          </span>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Buscar por email, cédula o rol…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className={styles.newBtn} onClick={openCreate}>
            + Nuevo usuario
          </button>
        </div>
      </div>

      <div className={styles.scrollBody}>
        {usersQuery.isLoading ? (
          <div className={styles.loadingState}>Cargando usuarios…</div>
        ) : usersQuery.isError ? (
          <div className={styles.loadingState}>Error al cargar usuarios.</div>
        ) : (
          <div className={styles.tableWrap}>
            <div
              className={styles.tableHeader}
              style={{ '--col-template': COL_TEMPLATE } as React.CSSProperties}
              role="row"
            >
              <span className={styles.colHead}>Email</span>
              <span className={styles.colHead}>Cédula</span>
              <span className={styles.colHead}>Tipo</span>
              <span className={styles.colHead}>Rol</span>
              <span className={styles.colHead}>Estado</span>
              <span className={styles.colHead}>Último acceso</span>
              <span className={styles.colHead}>Acciones</span>
            </div>

            {filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <span>No hay usuarios que coincidan con la búsqueda.</span>
              </div>
            ) : (
              filtered.map((user) => (
                <div
                  key={user.id}
                  className={styles.tableRow}
                  style={{ '--col-template': COL_TEMPLATE } as React.CSSProperties}
                  role="row"
                >
                  <span className={styles.cell} title={user.email}>
                    {user.email}
                  </span>
                  <span className={styles.cellMuted}>{user.cedula}</span>
                  <span className={styles.cellMuted}>{user.documentType}</span>
                  <span className={styles.cell}>{user.role.name}</span>
                  <span className={styles.cell}>
                    <span className={user.isActive ? styles.badgeActive : styles.badgeInactive}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </span>
                  <span className={styles.cellMuted}>{formatDate(user.lastLoginAt)}</span>
                  <span className={styles.actionsCell}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      title="Editar"
                      onClick={() => openEdit(user)}
                    >
                      <Pencil size={14} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtnDanger}
                      title="Desactivar"
                      disabled={!user.isActive}
                      onClick={() => setDeactivating(user)}
                    >
                      <UserX size={14} aria-hidden />
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {editing ? (
        <UserFormModal
          open={formOpen}
          mode="edit"
          initialValues={{ email: editing.email, roleId: editing.role.id }}
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
    </div>
  );
}
