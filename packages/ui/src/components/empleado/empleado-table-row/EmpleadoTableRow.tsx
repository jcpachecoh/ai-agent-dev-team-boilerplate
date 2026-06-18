import type { CSSProperties, JSX } from 'react';

import { EmpleadoAvatar } from '../empleado-avatar';
import { EmpleadoContractBadge } from '../empleado-contract-badge';
import { EmpleadoRowActionButton } from '../empleado-row-action-button';
import { EmpleadoStatusBadge } from '../empleado-status-badge';
import { getEmpleadoGridTemplate } from '../shared/empleado-columns';
import type { EmpleadoAvatarTone, EmpleadoSize, EmpleadoTheme } from '../shared/empleado-types';
import {
  formatEmpleadoCedula,
  formatEmpleadoContractLabel,
  formatEmpleadoHireDate,
  resolveEmpleadoAvatarTone,
  resolveEmpleadoInitials,
} from '../shared/empleado-utils';
import styles from './EmpleadoTableRow.module.scss';

export interface EmpleadoTableRowProps {
  id?: string;
  name?: string;
  email?: string;
  initials?: string;
  avatarTone?: EmpleadoAvatarTone;
  cedula?: string;
  position?: string;
  area?: string;
  contractType?: string;
  locationName?: string;
  locationCity?: string;
  hireDate?: string;
  isActive?: boolean;
  onEdit?: () => void;
  onToggleStatus?: () => void;
  showActions?: boolean;
  toggleLoading?: boolean;
  theme?: EmpleadoTheme;
  size?: EmpleadoSize;
  className?: string;
}

function resolveContractVariant(contractType?: string): 'indefinido' | 'servicios' | 'default' {
  const normalized = contractType?.toUpperCase();
  if (normalized === 'INDEFINIDO' || normalized === 'FIJO') return 'indefinido';
  if (normalized === 'PRESTACION' || normalized === 'SERVICIOS') return 'servicios';
  return 'default';
}

export function EmpleadoTableRow({
  id,
  name = 'Ana López',
  email,
  initials,
  avatarTone,
  cedula,
  position,
  area,
  contractType,
  locationName,
  locationCity,
  hireDate,
  isActive = true,
  onEdit,
  onToggleStatus,
  showActions: showActionsProp,
  toggleLoading = false,
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoTableRowProps): JSX.Element {
  const resolvedInitials = initials ?? resolveEmpleadoInitials(name);
  const resolvedTone = avatarTone ?? resolveEmpleadoAvatarTone(id ?? name);
  const contractLabel = formatEmpleadoContractLabel(contractType);
  const showActions = showActionsProp ?? Boolean(onEdit || onToggleStatus);

  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      data-empleado-id={id}
      style={{ '--empleado-columns': getEmpleadoGridTemplate(showActions) } as CSSProperties}
    >
      <div className={styles.employeeCell} role="cell">
        <EmpleadoAvatar initials={resolvedInitials} tone={resolvedTone} theme={theme} size="md" />
        <div className={styles.employeeText}>
          <span className={styles.name}>{name}</span>
          {email ? <span className={styles.email}>{email}</span> : null}
        </div>
      </div>
      <span className={styles.cedulaCell} role="cell">
        {formatEmpleadoCedula(cedula)}
      </span>
      <div className={styles.roleCell} role="cell">
        <span className={styles.position}>{position ?? '-'}</span>
        {area ? <span className={styles.area}>{area}</span> : null}
      </div>
      <div className={styles.contractCell} role="cell">
        <EmpleadoContractBadge
          label={contractLabel}
          variant={resolveContractVariant(contractType)}
          theme={theme}
          size="sm"
        />
      </div>
      <div className={styles.locationCell} role="cell">
        <span className={styles.locationName}>{locationName ?? '-'}</span>
        {locationCity ? <span className={styles.locationCity}>{locationCity}</span> : null}
      </div>
      <span className={styles.hireDateCell} role="cell">
        {formatEmpleadoHireDate(hireDate)}
      </span>
      <div className={styles.statusCell} role="cell">
        <EmpleadoStatusBadge active={isActive} theme={theme} size="sm" />
      </div>
      {showActions ? (
        <div className={styles.actionsCell} role="cell">
          <EmpleadoRowActionButton variant="edit" theme={theme} onClick={onEdit} />
          <EmpleadoRowActionButton
            variant="toggle"
            active={isActive}
            theme={theme}
            onClick={onToggleStatus}
            disabled={toggleLoading}
          />
        </div>
      ) : null}
    </div>
  );
}

export default EmpleadoTableRow;
