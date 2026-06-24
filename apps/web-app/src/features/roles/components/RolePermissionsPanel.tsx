import {
  PermisoCheckboxItem,
  PermisoModuleGroup,
  RolPermissionsPanel,
  groupPermissionsByModule,
  toast,
} from '@restopsiq/ui';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState, type JSX } from 'react';

import { getErrorMessage } from '@/lib/graphql-client';
import { useTheme } from '@/providers/ThemeProvider';

import { useAdminAssignRolePermissions } from '../hooks/useAdminRoleMutations';
import { useAdminRoleDetail, usePermissionCatalog } from '../hooks/useAdminRoles';
import type { AdminRole } from '../types';
import { AssignPermissionsModal } from './AssignPermissionsModal';
import styles from './RolePermissionsPanel.module.scss';

interface RolePermissionsPanelProps {
  role: AdminRole;
  canEdit: boolean;
  onClose: () => void;
}

type PermissionFilter = 'all' | 'selected' | 'unselected';

function countChanged(next: Set<string>, original: Set<string>): number {
  let count = 0;
  for (const id of next) {
    if (!original.has(id)) {
      count++;
    }
  }
  for (const id of original) {
    if (!next.has(id)) {
      count++;
    }
  }
  return count;
}

export function RolePermissionsPanel({
  role,
  canEdit,
  onClose,
}: RolePermissionsPanelProps): JSX.Element {
  const { theme } = useTheme();
  const detailQuery = useAdminRoleDetail(role.id);
  const catalogQuery = usePermissionCatalog();
  const assignMutation = useAdminAssignRolePermissions();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [originalIds, setOriginalIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PermissionFilter>('all');
  const [assigningOpen, setAssigningOpen] = useState(false);

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }
    const ids = new Set(detailQuery.data.permissions.map((p) => p.id));
    setSelectedIds(ids);
    setOriginalIds(ids);
  }, [detailQuery.data]);

  useEffect(() => {
    setSearch('');
    setFilter('all');
  }, [role.id]);

  const catalog = useMemo(
    () => (catalogQuery.data ?? []).filter((p) => p.isActive),
    [catalogQuery.data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((p) => {
      if (q) {
        const matches =
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          (p.module ?? '').toLowerCase().includes(q) ||
          (p.resource ?? '').toLowerCase().includes(q) ||
          (p.action ?? '').toLowerCase().includes(q);
        if (!matches) {
          return false;
        }
      }
      if (filter === 'selected') {
        return selectedIds.has(p.id);
      }
      if (filter === 'unselected') {
        return !selectedIds.has(p.id);
      }
      return true;
    });
  }, [catalog, search, filter, selectedIds]);

  const grouped = useMemo(() => groupPermissionsByModule(filtered), [filtered]);

  const toggle = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleModule = (modulePermissions: { id: string }[]): void => {
    const ids = modulePermissions.map((p) => p.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => {
          next.delete(id);
        });
      } else {
        ids.forEach((id) => {
          next.add(id);
        });
      }
      return next;
    });
  };

  const handleSave = async (): Promise<void> => {
    try {
      await assignMutation.mutateAsync({ roleId: role.id, permissionIds: [...selectedIds] });
      toast.success(`Permisos de "${role.name}" actualizados.`);
      setOriginalIds(new Set(selectedIds));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDiscard = (): void => {
    setSelectedIds(new Set(originalIds));
  };

  const handleAssignFromModal = (ids: string[]): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        next.add(id);
      });
      return next;
    });
    setAssigningOpen(false);
  };

  const isLoading = detailQuery.isLoading || catalogQuery.isLoading;
  const saving = assignMutation.isPending;
  const diffCount = countChanged(selectedIds, originalIds);

  return (
    <>
      <RolPermissionsPanel
        roleName={role.name}
        roleCode={role.code}
        dirtyCount={diffCount}
        loading={isLoading}
        canEdit={canEdit}
        saving={saving}
        theme={theme}
        onClose={onClose}
        onSave={() => {
          void handleSave();
        }}
        onDiscard={handleDiscard}
      >
        <div className={styles.controls}>
          <div className={styles.searchRow}>
            <input
              type="search"
              className={styles.search}
              placeholder="Buscar permiso…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              aria-label="Buscar permisos"
            />
            {canEdit ? (
              <button
                type="button"
                className={styles.newPermBtn}
                onClick={() => {
                  setAssigningOpen(true);
                }}
                aria-label="Agregar permiso"
                title="Agregar permiso existente"
                disabled={saving}
              >
                <Plus size={14} aria-hidden />
              </button>
            ) : null}
          </div>
          <div className={styles.filters} role="group" aria-label="Filtrar permisos">
            {(['all', 'selected', 'unselected'] as PermissionFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={[styles.filterBtn, filter === f ? styles.filterBtnActive : null]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  setFilter(f);
                }}
              >
                {f === 'all' ? 'Todos' : f === 'selected' ? 'Asignados' : 'No asignados'}
              </button>
            ))}
          </div>
        </div>

        {grouped.size === 0 ? (
          <p className={styles.empty}>
            {search || filter !== 'all'
              ? 'Sin resultados para el filtro actual.'
              : 'Sin permisos disponibles.'}
          </p>
        ) : (
          Array.from(grouped.entries()).map(([module, permissions]) => {
            const selectedInModule = permissions.filter((p) => selectedIds.has(p.id)).length;
            const allSelected = selectedInModule === permissions.length;
            return (
              <PermisoModuleGroup
                key={module}
                module={module}
                count={permissions.length}
                selectedCount={selectedInModule}
                allSelected={allSelected}
                onToggleAll={
                  canEdit && !saving
                    ? () => {
                        toggleModule(permissions);
                      }
                    : undefined
                }
                theme={theme}
              >
                {permissions.map((permission) => (
                  <PermisoCheckboxItem
                    key={permission.id}
                    code={permission.code}
                    name={permission.name}
                    checked={selectedIds.has(permission.id)}
                    disabled={!canEdit || saving}
                    onChange={() => {
                      toggle(permission.id);
                    }}
                    theme={theme}
                  />
                ))}
              </PermisoModuleGroup>
            );
          })
        )}
      </RolPermissionsPanel>

      <AssignPermissionsModal
        open={assigningOpen}
        assignedIds={selectedIds}
        catalog={catalogQuery.data ?? []}
        saving={saving}
        onClose={() => {
          setAssigningOpen(false);
        }}
        onConfirm={handleAssignFromModal}
      />
    </>
  );
}
