import type { CSSProperties, JSX } from 'react';

import { Switch } from '../../Switch';
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
  onView?: () => void;
  /** Override del aria-label/tooltip del botón "ver" (p.ej. "Ver tarjeta de asistencia" en OS-550). */
  viewLabel?: string;
  onEdit?: () => void;
  /** Override del aria-label del botón editar (p.ej. cuando abre consulta de perfil). */
  editLabel?: string;
  onToggleStatus?: () => void;
  /** OS-550 follow-up — acción "Historial" (solo OWNER/SUPER_ADMIN). */
  onHistory?: () => void;
  showActions?: boolean;
  toggleLoading?: boolean;
  /** OS-550 — activa las columnas Primer/Segundo apellido, Supervisor, Turno y Portal trabajador. */
  showAttendanceColumns?: boolean;
  primerApellido?: string | null;
  segundoApellido?: string | null;
  supervisorsLabel?: string;
  turnoLabel?: string;
  /** OS-550 follow-up — si se omite, la celda cae al texto "Pendiente" (portal aún no implementado). */
  portalWorker?: {
    checked: boolean;
    disabled?: boolean;
    loading?: boolean;
    onChange?: (checked: boolean) => void;
  };
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
  onView,
  viewLabel,
  onEdit,
  editLabel,
  onToggleStatus,
  onHistory,
  showActions: showActionsProp,
  toggleLoading = false,
  showAttendanceColumns = false,
  primerApellido,
  segundoApellido,
  supervisorsLabel,
  turnoLabel,
  portalWorker,
  theme = 'dark',
  size = 'md',
  className,
}: EmpleadoTableRowProps): JSX.Element {
  const resolvedInitials = initials ?? resolveEmpleadoInitials(name);
  const resolvedTone = avatarTone ?? resolveEmpleadoAvatarTone(id ?? name);
  const contractLabel = formatEmpleadoContractLabel(contractType);
  const showActions = showActionsProp ?? Boolean(onView || onEdit || onToggleStatus || onHistory);

  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      data-empleado-id={id}
      style={
        {
          '--empleado-columns': getEmpleadoGridTemplate(showActions, showAttendanceColumns),
        } as CSSProperties
      }
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
      {showAttendanceColumns ? (
        <span className={styles.cedulaCell} role="cell">
          {primerApellido ?? '-'}
        </span>
      ) : null}
      {showAttendanceColumns ? (
        <span className={styles.cedulaCell} role="cell">
          {segundoApellido ?? '-'}
        </span>
      ) : null}
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
      {showAttendanceColumns ? (
        <span className={styles.cedulaCell} role="cell">
          {supervisorsLabel ?? 'N/A'}
        </span>
      ) : null}
      {showAttendanceColumns ? (
        <span className={styles.cedulaCell} role="cell">
          {turnoLabel ?? 'N/A'}
        </span>
      ) : null}
      {showAttendanceColumns ? (
        <span className={styles.cedulaCell} role="cell">
          {portalWorker ? (
            <Switch
              checked={portalWorker.checked}
              disabled={portalWorker.disabled}
              loading={portalWorker.loading}
              onChange={portalWorker.onChange}
              theme={theme}
              size="sm"
              aria-label="Portal trabajador"
            />
          ) : (
            'Pendiente'
          )}
        </span>
      ) : null}
      {showActions ? (
        <div className={styles.actionsCell} role="cell">
          {onView ? (
            <EmpleadoRowActionButton
              variant="view"
              theme={theme}
              onClick={onView}
              aria-label={viewLabel}
            />
          ) : null}
          {onEdit ? (
            <EmpleadoRowActionButton
              variant="edit"
              theme={theme}
              onClick={onEdit}
              aria-label={editLabel}
            />
          ) : null}
          {onToggleStatus ? (
            <EmpleadoRowActionButton
              variant="toggle"
              active={isActive}
              theme={theme}
              onClick={onToggleStatus}
              disabled={toggleLoading}
            />
          ) : null}
          {onHistory ? (
            <EmpleadoRowActionButton variant="history" theme={theme} onClick={onHistory} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default EmpleadoTableRow;
