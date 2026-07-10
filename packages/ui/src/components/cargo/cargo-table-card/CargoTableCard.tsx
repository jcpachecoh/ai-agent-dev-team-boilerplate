import type { JSX } from 'react';

import { CargoRowActionButton } from '../cargo-row-action-button';
import { CargoStatusBadge } from '../cargo-status-badge';
import type { CargoTableRowProps } from '../cargo-table-row';
import styles from './CargoTableCard.module.scss';
import { formatCargoSalary } from '../shared/cargo-utils';

export type CargoTableCardProps = CargoTableRowProps;

export function CargoTableCard({
  id,
  title = 'Cargo',
  area,
  supervisors,
  baseSalaryRange,
  isActive = true,
  onEdit,
  onToggleStatus,
  showActions: showActionsProp,
  toggleLoading = false,
  theme = 'dark',
  size = 'md',
  className,
}: CargoTableCardProps): JSX.Element {
  const showActions = showActionsProp ?? Boolean(onEdit || onToggleStatus);
  const supervisorsLabel =
    supervisors && supervisors.length > 0 ? supervisors.join(', ') : 'Sin supervisor';

  return (
    <article
      className={[styles.card, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      data-cargo-id={id}
    >
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <p className={styles.title}>{title}</p>
          {area ? <p className={styles.area}>{area}</p> : null}
        </div>
        <CargoStatusBadge active={isActive} theme={theme} size="sm" />
      </header>

      <dl className={styles.details}>
        <div className={styles.detailRow}>
          <dt>Área</dt>
          <dd>{area ?? '-'}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Supervisor(es)</dt>
          <dd>{supervisorsLabel}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Rango salarial base</dt>
          <dd className={styles.salary}>{formatCargoSalary(baseSalaryRange)}</dd>
        </div>
      </dl>

      {showActions ? (
        <footer className={styles.footer}>
          <CargoRowActionButton variant="edit" theme={theme} onClick={onEdit} />
          <CargoRowActionButton
            variant="toggle"
            active={isActive}
            theme={theme}
            onClick={onToggleStatus}
            disabled={toggleLoading}
          />
        </footer>
      ) : null}
    </article>
  );
}

export default CargoTableCard;
