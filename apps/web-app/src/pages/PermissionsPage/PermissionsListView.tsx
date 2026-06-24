import { toast } from '@restopsiq/ui';
import { Pencil, Plus, PowerOff } from 'lucide-react';
import { useMemo, useState, type JSX } from 'react';

import { SYSTEM_ADMIN_ROLES } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { PermissionFormModal } from '@/features/roles/components/PermissionFormModal';
import {
  useAdminCreatePermission,
  useAdminDeactivatePermission,
  useAdminUpdatePermission,
} from '@/features/roles/hooks/useAdminRoleMutations';
import { usePermissionCatalog } from '@/features/roles/hooks/useAdminRoles';
import type { PermissionCatalogItem, PermissionFormValues } from '@/features/roles/types';
import { getErrorMessage } from '@/lib/graphql-client';

import styles from './PermissionsListView.module.scss';

function groupByModule(items: PermissionCatalogItem[]): Map<string, PermissionCatalogItem[]> {
  const map = new Map<string, PermissionCatalogItem[]>();
  for (const item of items) {
    const key = item.module ?? 'other';
    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  }
  return map;
}

export default function PermissionsListView(): JSX.Element {
  const { data: me } = useMe();
  const { data, isLoading } = usePermissionCatalog(true);
  const createMutation = useAdminCreatePermission();
  const updateMutation = useAdminUpdatePermission();
  const deactivateMutation = useAdminDeactivatePermission();

  const [creatingPermission, setCreatingPermission] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionCatalogItem | undefined>();
  const [deactivatingPermission, setDeactivatingPermission] = useState<
    PermissionCatalogItem | undefined
  >();

  const isSystemAdmin = (SYSTEM_ADMIN_ROLES as readonly string[]).includes(me?.roleCode ?? '');
  const grouped = useMemo(() => groupByModule(data ?? []), [data]);

  const handleCreate = async (values: PermissionFormValues & { code: string }): Promise<void> => {
    try {
      await createMutation.mutateAsync(values);
      toast.success(`Permiso "${values.code}" creado correctamente.`);
      setCreatingPermission(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleUpdate = async (values: PermissionFormValues): Promise<void> => {
    if (!editingPermission) {
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: editingPermission.id, input: values });
      toast.success(`Permiso "${editingPermission.code}" actualizado.`);
      setEditingPermission(undefined);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeactivate = async (): Promise<void> => {
    if (!deactivatingPermission) {
      return;
    }
    try {
      await deactivateMutation.mutateAsync(deactivatingPermission.id);
      toast.success(`Permiso "${deactivatingPermission.code}" desactivado.`);
      setDeactivatingPermission(undefined);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const permSaving = createMutation.isPending || updateMutation.isPending;
  const deactivatingSaving = deactivateMutation.isPending;

  return (
    <>
      <div className={styles.screen}>
        <header className={styles.pageHeader}>
          <div className={styles.headerTop}>
            <div>
              <h1>Catálogo de permisos</h1>
              <p>Define los permisos que pueden asignarse a los roles del sistema.</p>
            </div>
            {isSystemAdmin ? (
              <button
                type="button"
                className={styles.newPermBtn}
                onClick={() => {
                  setCreatingPermission(true);
                }}
                aria-label="Nuevo permiso"
              >
                <Plus size={14} aria-hidden />
                Nuevo permiso
              </button>
            ) : null}
          </div>
        </header>

        <div className={styles.body}>
          {isLoading ? (
            <div className={styles.loading}>Cargando permisos…</div>
          ) : (
            Array.from(grouped.entries()).map(([module, perms]) => (
              <section key={module} className={styles.moduleSection}>
                <div className={styles.moduleHeader}>
                  <span className={styles.moduleTitle}>{module}</span>
                  <span className={styles.moduleCount}>{perms.length}</span>
                </div>
                <div className={styles.permissionList}>
                  {perms.map((p) => (
                    <div key={p.id} className={styles.permissionRow}>
                      <span
                        className={[styles.permCode, !p.isActive ? styles.inactive : '']
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {p.code}
                      </span>
                      <span className={styles.permName}>{p.name}</span>
                      {p.description ? (
                        <span className={styles.permDesc}>{p.description}</span>
                      ) : (
                        <span />
                      )}
                      {!p.isActive ? (
                        <span className={styles.badgeInactive}>Inactivo</span>
                      ) : (
                        <span />
                      )}
                      {isSystemAdmin ? (
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => {
                              setEditingPermission(p);
                            }}
                            aria-label={`Editar ${p.code}`}
                            title="Editar permiso"
                          >
                            <Pencil size={13} aria-hidden />
                          </button>
                          {p.isActive ? (
                            <button
                              type="button"
                              className={[styles.actionBtn, styles.actionBtnDanger].join(' ')}
                              onClick={() => {
                                setDeactivatingPermission(p);
                              }}
                              aria-label={`Desactivar ${p.code}`}
                              title="Desactivar permiso"
                            >
                              <PowerOff size={13} aria-hidden />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <PermissionFormModal
        open={creatingPermission}
        mode="create"
        saving={permSaving}
        onClose={() => {
          setCreatingPermission(false);
        }}
        onSave={(values) => {
          void handleCreate(values);
        }}
      />

      {editingPermission ? (
        <PermissionFormModal
          open={Boolean(editingPermission)}
          mode="edit"
          permission={editingPermission}
          saving={permSaving}
          onClose={() => {
            setEditingPermission(undefined);
          }}
          onSave={(values) => {
            void handleUpdate(values);
          }}
        />
      ) : null}

      {deactivatingPermission ? (
        <div
          className={styles.confirmBackdrop}
          onClick={() => {
            setDeactivatingPermission(undefined);
          }}
          role="presentation"
        >
          <div
            className={styles.confirmDialog}
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <p className={styles.confirmMsg}>
              ¿Desactivar el permiso{' '}
              <code className={styles.confirmCode}>{deactivatingPermission.code}</code>?<br />
              <span className={styles.confirmSub}>
                Si está asignado a roles, dejará de tener efecto para todos ellos.
              </span>
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setDeactivatingPermission(undefined);
                }}
                disabled={deactivatingSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.deactivateBtn}
                onClick={() => {
                  void handleDeactivate();
                }}
                disabled={deactivatingSaving}
              >
                {deactivatingSaving ? 'Desactivando…' : 'Desactivar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
