import {
  CargoRowActionButton,
  CargoStatusBadge,
  getGridTemplateFromColumns,
  type CargoColumnDef,
  type CargoTheme,
} from '@restopsiq/ui';
import type { CSSProperties } from 'react';

import type { Turno } from '../../types/turnos.types';
import { formatTurnoDaysOfWeek } from '../../utils/format-turno-days';
import styles from './TurnosTableRow.module.scss';

export interface TurnosTableRowProps {
  turno: Turno;
  columns: CargoColumnDef[];
  locationName: string;
  scheduleLabel: string;
  showActions?: boolean;
  toggleLoading?: boolean;
  theme?: CargoTheme;
  className?: string;
  onEdit?: () => void;
  onToggleStatus?: () => void;
}

export function TurnosTableRow({
  turno,
  columns,
  locationName,
  scheduleLabel,
  showActions = false,
  toggleLoading = false,
  theme = 'dark',
  className,
  onEdit,
  onToggleStatus,
}: TurnosTableRowProps): React.JSX.Element {
  const gridTemplate = getGridTemplateFromColumns(columns);

  return (
    <div
      className={[styles.row, className].filter(Boolean).join(' ')}
      role="row"
      data-cargo-id={turno.id}
      style={{ '--cargo-columns': gridTemplate } as CSSProperties}
    >
      <span className={styles.titleCell} role="cell">
        {turno.nombre}
      </span>
      <span className={styles.cell} role="cell">
        {turno.sigla}
      </span>
      <span className={styles.cell} role="cell" title={locationName}>
        {locationName}
      </span>
      <span className={styles.cell} role="cell" title={formatTurnoDaysOfWeek(turno.daysOfWeek)}>
        {formatTurnoDaysOfWeek(turno.daysOfWeek)}
      </span>
      <span className={styles.scheduleCell} role="cell">
        {scheduleLabel}
      </span>
      <div className={styles.statusCell} role="cell">
        <CargoStatusBadge active={turno.estado} theme={theme} size="sm" />
      </div>
      {showActions ? (
        <div className={styles.actionsCell} role="cell">
          <CargoRowActionButton variant="edit" theme={theme} onClick={onEdit} />
          <CargoRowActionButton
            variant="toggle"
            active={turno.estado}
            theme={theme}
            onClick={onToggleStatus}
            disabled={toggleLoading}
          />
        </div>
      ) : null}
    </div>
  );
}
