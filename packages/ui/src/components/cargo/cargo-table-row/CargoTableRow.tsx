import type { CSSProperties, JSX } from 'react';

import { CargoRowActionButton } from '../cargo-row-action-button';
import { CargoStatusBadge } from '../cargo-status-badge';
import styles from './CargoTableRow.module.scss';
import { useCargoTableGridTemplate } from '../cargo-table/CargoTableGridContext';
import { getCargoGridTemplate } from '../shared/cargo-columns';
import type { CargoSize, CargoTheme } from '../shared/cargo-types';
import { formatCargoSalary } from '../shared/cargo-utils';

export interface CargoTableRowProps {
  id?: string;
  title?: string;
  area?: string;
  supervisors?: string[];
  baseSalaryRange?: number | string;
  isActive?: boolean;
  onEdit?: () => void;
  onToggleStatus?: () => void;
  showActions?: boolean;
  toggleLoading?: boolean;
  theme?: CargoTheme;
  size?: CargoSize;
  className?: string;
}

export function CargoTableRow({
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
}: CargoTableRowProps): JSX.Element {
  const showActions = showActionsProp ?? Boolean(onEdit || onToggleStatus);
  const gridTemplate = useCargoTableGridTemplate(getCargoGridTemplate(showActions));
  const supervisorsLabel =
    supervisors && supervisors.length > 0 ? supervisors.join(', ') : 'Sin supervisor';

  return (
    <div
      className={[styles.row, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      role="row"
      data-cargo-id={id}
      style={{ '--cargo-columns': gridTemplate } as CSSProperties}
    >
      <span className={styles.titleCell} role="cell">
        {title}
      </span>
      <span className={styles.areaCell} role="cell">
        {area ?? '-'}
      </span>
      <span className={styles.supervisorsCell} role="cell" title={supervisorsLabel}>
        {supervisorsLabel}
      </span>
      <span className={styles.salaryCell} role="cell">
        {formatCargoSalary(baseSalaryRange)}
      </span>
      <div className={styles.statusCell} role="cell">
        <CargoStatusBadge active={isActive} theme={theme} size="sm" />
      </div>
      {showActions ? (
        <div className={styles.actionsCell} role="cell">
          <CargoRowActionButton variant="edit" theme={theme} onClick={onEdit} />
          <CargoRowActionButton
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

export default CargoTableRow;
