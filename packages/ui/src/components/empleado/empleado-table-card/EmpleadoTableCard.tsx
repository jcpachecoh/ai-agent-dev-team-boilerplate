import type { JSX } from 'react';

import { Switch } from '../../Switch';
import { EmpleadoAvatar } from '../empleado-avatar';
import { EmpleadoContractBadge } from '../empleado-contract-badge';
import { EmpleadoRowActionButton } from '../empleado-row-action-button';
import { EmpleadoStatusBadge } from '../empleado-status-badge';
import type { EmpleadoTableRowProps } from '../empleado-table-row';
import {
  formatEmpleadoCedula,
  formatEmpleadoContractLabel,
  formatEmpleadoHireDate,
  resolveEmpleadoAvatarTone,
  resolveEmpleadoInitials,
} from '../shared/empleado-utils';
import styles from './EmpleadoTableCard.module.scss';

export type EmpleadoTableCardProps = EmpleadoTableRowProps;

function resolveContractVariant(contractType?: string): 'indefinido' | 'servicios' | 'default' {
  const normalized = contractType?.toUpperCase();
  if (normalized === 'INDEFINIDO' || normalized === 'FIJO') return 'indefinido';
  if (normalized === 'PRESTACION' || normalized === 'SERVICIOS') return 'servicios';
  return 'default';
}

export function EmpleadoTableCard({
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
}: EmpleadoTableCardProps): JSX.Element {
  const resolvedInitials = initials ?? resolveEmpleadoInitials(name);
  const resolvedTone = avatarTone ?? resolveEmpleadoAvatarTone(id ?? name);
  const contractLabel = formatEmpleadoContractLabel(contractType);
  const showActions = showActionsProp ?? Boolean(onView || onEdit || onToggleStatus || onHistory);

  return (
    <article
      className={[styles.card, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      data-empleado-id={id}
    >
      <header className={styles.header}>
        <div className={styles.employeeCell}>
          <EmpleadoAvatar initials={resolvedInitials} tone={resolvedTone} theme={theme} size="md" />
          <div className={styles.employeeText}>
            <p className={styles.name}>{name}</p>
            {email ? <p className={styles.email}>{email}</p> : null}
          </div>
        </div>
        <EmpleadoStatusBadge active={isActive} theme={theme} size="sm" />
      </header>

      <dl className={styles.details}>
        <div className={styles.detailRow}>
          <dt>Cédula</dt>
          <dd>{formatEmpleadoCedula(cedula)}</dd>
        </div>
        {showAttendanceColumns ? (
          <div className={styles.detailRow}>
            <dt>Primer apellido</dt>
            <dd>{primerApellido ?? '-'}</dd>
          </div>
        ) : null}
        {showAttendanceColumns ? (
          <div className={styles.detailRow}>
            <dt>Segundo apellido</dt>
            <dd>{segundoApellido ?? '-'}</dd>
          </div>
        ) : null}
        <div className={styles.detailRow}>
          <dt>Cargo / Área</dt>
          <dd>
            <span>{position ?? '-'}</span>
            {area ? <span className={styles.subValue}>{area}</span> : null}
          </dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Contrato</dt>
          <dd>
            <EmpleadoContractBadge
              label={contractLabel}
              variant={resolveContractVariant(contractType)}
              theme={theme}
              size="sm"
            />
          </dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Sede</dt>
          <dd>
            <span>{locationName ?? '-'}</span>
            {locationCity ? <span className={styles.subValue}>{locationCity}</span> : null}
          </dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Ingreso</dt>
          <dd>{formatEmpleadoHireDate(hireDate)}</dd>
        </div>
        {showAttendanceColumns ? (
          <div className={styles.detailRow}>
            <dt>Supervisor</dt>
            <dd>{supervisorsLabel ?? 'N/A'}</dd>
          </div>
        ) : null}
        {showAttendanceColumns ? (
          <div className={styles.detailRow}>
            <dt>Turno</dt>
            <dd>{turnoLabel ?? 'N/A'}</dd>
          </div>
        ) : null}
        {showAttendanceColumns ? (
          <div className={styles.detailRow}>
            <dt>Portal trabajador</dt>
            <dd>
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
            </dd>
          </div>
        ) : null}
      </dl>

      {showActions ? (
        <footer className={styles.footer}>
          {onView ? (
            <EmpleadoRowActionButton
              variant="view"
              theme={theme}
              onClick={onView}
              aria-label={viewLabel}
            />
          ) : null}
          {onEdit ? (
            <EmpleadoRowActionButton variant="edit" theme={theme} onClick={onEdit} />
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
        </footer>
      ) : null}
    </article>
  );
}

export default EmpleadoTableCard;
