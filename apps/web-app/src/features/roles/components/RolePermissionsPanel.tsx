import {
  PermisoCheckboxItem,
  PermisoModuleGroup,
  RolPermissionsPanel,
  groupPermissionsByModule,
  toast,
} from '@restopsiq/ui';
import { useEffect, useMemo, useState, type JSX } from 'react';

import { useTheme } from '@/providers/ThemeProvider';
import { getErrorMessage } from '@/lib/graphql-client';

import { useAdminAssignRolePermissions } from '../hooks/useAdminRoleMutations';
import { useAdminRoleDetail, usePermissionCatalog } from '../hooks/useAdminRoles';
import type { AdminRole } from '../types';

interface RolePermissionsPanelProps {
  role: AdminRole;
  canEdit: boolean;
  onClose: () => void;
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

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }
    const ids = new Set(detailQuery.data.permissions.map((permission) => permission.id));
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
  const grouped = useMemo(() => groupPermissionsByModule(catalog), [catalog]);

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
    <RolPermissionsPanel
      roleName={role.name}
      roleCode={role.code}
      dirtyCount={diffCount}
      loading={isLoading}
      canEdit={canEdit}
      saving={saving}
      theme={theme}
      onClose={onClose}
      onSave={() => void handleSave()}
      onDiscard={handleDiscard}
    >
      {Array.from(grouped.entries()).map(([module, permissions]) => (
        <PermisoModuleGroup key={module} module={module} count={permissions.length} theme={theme}>
          {permissions.map((permission) => (
            <PermisoCheckboxItem
              key={permission.id}
              code={permission.code}
              name={permission.name}
              checked={selectedIds.has(permission.id)}
              disabled={!canEdit || saving}
              onChange={() => toggle(permission.id)}
              theme={theme}
            />
          ))}
        </PermisoModuleGroup>
      ))}
    </RolPermissionsPanel>
  );
}
