import { toast } from '@restopsiq/ui';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState, type JSX } from 'react';

import { getErrorMessage } from '@/lib/graphql-client';

import { useAdminAssignRolePermissions } from '../hooks/useAdminRoleMutations';
import { useAdminRoleDetail, usePermissionCatalog } from '../hooks/useAdminRoles';
import type { AdminRole, PermissionCatalogItem } from '../types';
import { PermissionCheckbox } from './PermissionCheckbox';
import styles from './RolePermissionsPanel.module.scss';

interface RolePermissionsPanelProps {
  role: AdminRole;
  canEdit: boolean;
  onClose: () => void;
}

function groupByModule(permissions: PermissionCatalogItem[]): Map<string, PermissionCatalogItem[]> {
  const map = new Map<string, PermissionCatalogItem[]>();
  for (const p of permissions) {
    const key = p.module ?? 'other';
    const group = map.get(key) ?? [];
    group.push(p);
    map.set(key, group);
  }
  return map;
}

export function RolePermissionsPanel({
  role,
  canEdit,
  onClose,
}: RolePermissionsPanelProps): JSX.Element {
  const detailQuery = useAdminRoleDetail(role.id);
  const catalogQuery = usePermissionCatalog();
  const assignMutation = useAdminAssignRolePermissions();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [originalIds, setOriginalIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }
    const ids = new Set(detailQuery.data.permissions.map((p) => p.id));
    setSelectedIds(ids);
    setOriginalIds(ids);
  }, [detailQuery.data]);

  const isDirty = useMemo(() => {
    if (selectedIds.size !== originalIds.size) {
      return true;
    }
    for (const id of selectedIds) {
      if (!originalIds.has(id)) {
        return true;
      }
    }
    return false;
  }, [selectedIds, originalIds]);

  const catalog = catalogQuery.data ?? [];
  const grouped = useMemo(() => groupByModule(catalog), [catalog]);

  const toggle = (id: string) => {
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

  const handleSave = async () => {
    try {
      await assignMutation.mutateAsync({ roleId: role.id, permissionIds: [...selectedIds] });
      toast.success(`Permisos de "${role.name}" actualizados.`);
      setOriginalIds(new Set(selectedIds));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDiscard = () => {
    setSelectedIds(new Set(originalIds));
  };

  const isLoading = detailQuery.isLoading || catalogQuery.isLoading;
  const saving = assignMutation.isPending;
  const diffCount =
    Math.abs(selectedIds.size - originalIds.size) + countChanged(selectedIds, originalIds);

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <h3 className={styles.panelRoleName}>{role.name}</h3>
          <span className={styles.panelRoleCode}>{role.code}</span>
          {isDirty ? (
            <span className={styles.dirtyBadge}>
              {diffCount} cambio{diffCount !== 1 ? 's' : ''}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Cerrar panel"
        >
          <X size={14} aria-hidden />
        </button>
      </div>

      <div className={styles.panelBody}>
        {isLoading ? (
          <div className={styles.loading}>Cargando permisos…</div>
        ) : (
          Array.from(grouped.entries()).map(([module, perms]) => (
            <div key={module} className={styles.moduleGroup}>
              <div className={styles.moduleLabel}>
                {module}
                <span className={styles.moduleCount}>({perms.length})</span>
              </div>
              {perms.map((p) => (
                <PermissionCheckbox
                  key={p.id}
                  permission={p}
                  checked={selectedIds.has(p.id)}
                  disabled={!canEdit || saving}
                  onChange={() => toggle(p.id)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      <div className={styles.panelFooter}>
        {canEdit ? (
          <>
            <button
              type="button"
              className={styles.discardBtn}
              onClick={handleDiscard}
              disabled={!isDirty || saving}
            >
              Descartar
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={() => void handleSave()}
              disabled={!isDirty || saving}
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </>
        ) : (
          <span className={styles.readonlyNote}>
            Solo lectura — sin permiso para asignar permisos
          </span>
        )}
      </div>
    </div>
  );
}

function countChanged(next: Set<string>, original: Set<string>): number {
  let count = 0;
  for (const id of next) {
    if (!original.has(id)) {
      count++;
    }
  }
  return count;
}
