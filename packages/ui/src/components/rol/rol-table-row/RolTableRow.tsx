import type { CSSProperties, JSX, MouseEvent } from 'react';

import { RolCodeChip } from '../rol-code-chip';
import { RolMetricCell } from '../rol-metric-cell';
import { EmpleadoRowActionButton } from '../../empleado/empleado-row-action-button';
import { RolRowActionButton } from '../rol-row-action-button';
import { RolStatusBadge } from '../rol-status-badge';
import { getRolGridTemplate } from '../shared/rol-columns';
import type { RolSize, RolTheme } from '../shared/rol-types';
import styles from './RolTableRow.module.scss';

export interface RolTableRowProps {
  id: string;
  code: string;
  name: string;
  userCount: number;
  permissionCount: number;
  isActive: boolean;
  selected?: boolean;
  showActions?: boolean;
  onSelect?: () => void;
  onViewPermissions?: () => void;
  onEdit?: () => void;
  onDeactivate?: () => void;
  onDuplicate?: () => void;
  theme?: RolTheme;
  size?: RolSize;
  className?: string;
}

export function RolTableRow({
  id,
  code,
  name,
  userCount,
  permissionCount,
  isActive,
  selected = false,
  showActions = true,
  onSelect,
  onViewPermissions,
  onEdit,
  onDeactivate,
  onDuplicate,
  theme = 'dark',
  size = 'md',
  className,
}: RolTableRowProps): JSX.Element {
  const handleRowClick = () => {
    onSelect?.();
  };

  const stopRowClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      className={[
        styles.row,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        selected ? styles.selected : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="row"
      data-rol-id={id}
      onClick={handleRowClick}
      style={{ '--rol-columns': getRolGridTemplate(showActions) } as CSSProperties}
    >
      <span className={styles.cell} role="cell">
        <RolCodeChip code={code} theme={theme} size="sm" />
      </span>
      <span className={styles.cell} role="cell">
        {name}
      </span>
      <span role="cell">
        <RolMetricCell value={userCount} theme={theme} size={size} />
      </span>
      <span role="cell">
        <RolMetricCell value={permissionCount} theme={theme} size={size} />
      </span>
      <span className={styles.cell} role="cell">
        <RolStatusBadge active={isActive} theme={theme} size="sm" />
      </span>
      {showActions ? (
        <span className={styles.actionsCell} role="cell" onClick={stopRowClick}>
          <RolRowActionButton
            variant="permissions"
            theme={theme}
            size="sm"
            onClick={onViewPermissions ?? onSelect}
          />
          {onEdit ? (
            <EmpleadoRowActionButton variant="edit" theme={theme} size="sm" onClick={onEdit} />
          ) : null}
          {onDuplicate ? (
            <RolRowActionButton variant="duplicate" theme={theme} size="sm" onClick={onDuplicate} />
          ) : null}
          {onDeactivate ? (
            <EmpleadoRowActionButton
              variant="toggle"
              active={isActive}
              theme={theme}
              size="sm"
              disabled={!isActive}
              aria-label="Desactivar rol"
              onClick={onDeactivate}
            />
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

export default RolTableRow;
