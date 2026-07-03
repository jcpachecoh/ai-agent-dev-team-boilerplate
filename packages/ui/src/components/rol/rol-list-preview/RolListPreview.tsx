import type { JSX, ReactNode } from 'react';

import { PermisoCheckboxItem } from '../../permiso/permiso-checkbox-item';
import { PermisoModuleGroup } from '../../permiso/permiso-module-group';
import { RolActionButton } from '../rol-action-button';
import { RolListToolbar } from '../rol-list-toolbar';
import { RolPage } from '../rol-page';
import { RolPageHeader } from '../rol-page-header';
import { RolPageSection } from '../rol-page-section';
import { RolPermissionsPanel } from '../rol-permissions-panel';
import { RolSplitLayout } from '../rol-split-layout';
import { RolTable } from '../rol-table';
import { RolTableRow } from '../rol-table-row';
import { defaultRolDemoRows } from '../shared/rol-demo-data';
import type { RolSize, RolTheme } from '../shared/rol-types';
import type { RolTableRowProps } from '../rol-table-row';
import styles from './RolListPreview.module.scss';

export interface RolListPreviewProps {
  title?: string;
  subtitle?: string;
  rows?: RolTableRowProps[];
  selectedRoleId?: string;
  showPanel?: boolean;
  canManage?: boolean;
  canAssignPermissions?: boolean;
  onCreate?: () => void;
  onSelectRole?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  panelContent?: ReactNode;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

const demoPermissions = [
  { id: 'p1', code: 'users.read', name: 'Ver usuarios' },
  { id: 'p2', code: 'users.write', name: 'Editar usuarios' },
  { id: 'p3', code: 'payroll.read', name: 'Ver nómina' },
];

export function RolListPreview({
  title = 'Roles',
  subtitle = 'Gestión de roles y asignación de permisos por rol',
  rows = defaultRolDemoRows,
  selectedRoleId,
  showPanel = false,
  canManage = true,
  canAssignPermissions = true,
  onCreate,
  onSelectRole,
  onEdit,
  onDeactivate,
  panelContent,
  theme = 'dark',
  size = 'md',
  className,
}: RolListPreviewProps): JSX.Element {
  const selectedRole = rows.find((row) => row.id === selectedRoleId) ?? rows[0];
  const hasPanel = showPanel && Boolean(selectedRole);

  return (
    <RolPage theme={theme} size={size} className={className}>
      <RolPageSection theme={theme} divider sticky variant="header">
        <RolPageHeader title={title} subtitle={subtitle} theme={theme} size={size} />
      </RolPageSection>

      <RolPageSection theme={theme} divider sticky variant="toolbar">
        <RolListToolbar
          count={rows.length}
          countLabel="roles"
          theme={theme}
          size={size}
          primaryAction={
            canManage ? <RolActionButton theme={theme} size={size} onClick={onCreate} /> : null
          }
        />
      </RolPageSection>

      <RolPageSection theme={theme} variant="body">
        <RolSplitLayout
          theme={theme}
          table={
            <div className={styles.tableWrap}>
              <RolTable
                theme={theme}
                size={size}
                showActions={canManage}
                emptyState={<div className={styles.empty}>No hay roles registrados.</div>}
              >
                {rows.map((row) => (
                  <RolTableRow
                    key={row.id}
                    {...row}
                    selected={row.id === selectedRoleId}
                    showActions={canManage}
                    theme={theme}
                    size={size}
                    onSelect={() => onSelectRole?.(row.id)}
                    onViewPermissions={() => onSelectRole?.(row.id)}
                    onEdit={onEdit ? () => onEdit(row.id) : undefined}
                    onDeactivate={onDeactivate ? () => onDeactivate(row.id) : undefined}
                  />
                ))}
              </RolTable>
            </div>
          }
          panel={
            hasPanel && selectedRole ? (
              <RolPermissionsPanel
                roleName={selectedRole.name}
                roleCode={selectedRole.code}
                dirtyCount={canAssignPermissions ? 2 : 0}
                canEdit={canAssignPermissions}
                theme={theme}
                onClose={() => undefined}
                onSave={() => undefined}
                onDiscard={() => undefined}
              >
                {panelContent ?? (
                  <PermisoModuleGroup module="users" count={2} theme={theme}>
                    {demoPermissions.slice(0, 2).map((permission) => (
                      <PermisoCheckboxItem
                        key={permission.id}
                        code={permission.code}
                        name={permission.name}
                        checked={permission.id === 'p1'}
                        disabled={!canAssignPermissions}
                        onChange={() => undefined}
                        theme={theme}
                      />
                    ))}
                  </PermisoModuleGroup>
                )}
              </RolPermissionsPanel>
            ) : null
          }
        />
      </RolPageSection>
    </RolPage>
  );
}

export default RolListPreview;
