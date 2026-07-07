import { CargoRowActionButton, CargoStatusBadge, type CargoTheme } from '@restopsiq/ui';

import type { Turno } from '../../types/turnos.types';
import { formatTurnoDaysOfWeek } from '../../utils/format-turno-days';
import styles from './TurnosTableCard.module.scss';

export interface TurnosTableCardProps {
  turno: Turno;
  locationName: string;
  scheduleLabel: string;
  showActions?: boolean;
  toggleLoading?: boolean;
  theme?: CargoTheme;
  className?: string;
  onEdit?: () => void;
  onToggleStatus?: () => void;
}

export function TurnosTableCard({
  turno,
  locationName,
  scheduleLabel,
  showActions = false,
  toggleLoading = false,
  theme = 'dark',
  className,
  onEdit,
  onToggleStatus,
}: TurnosTableCardProps): React.JSX.Element {
  return (
    <article
      className={[styles.card, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      data-cargo-id={turno.id}
    >
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <p className={styles.title}>{turno.nombre}</p>
          <p className={styles.sigla}>{turno.sigla}</p>
        </div>
        <CargoStatusBadge active={turno.estado} theme={theme} size="sm" />
      </header>

      <dl className={styles.details}>
        <div className={styles.detailRow}>
          <dt>Sede</dt>
          <dd>{locationName}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Días</dt>
          <dd>{formatTurnoDaysOfWeek(turno.daysOfWeek)}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Horario</dt>
          <dd className={styles.schedule}>{scheduleLabel}</dd>
        </div>
      </dl>

      {showActions ? (
        <footer className={styles.footer}>
          <CargoRowActionButton variant="edit" theme={theme} onClick={onEdit} />
          <CargoRowActionButton
            variant="toggle"
            active={turno.estado}
            theme={theme}
            onClick={onToggleStatus}
            disabled={toggleLoading}
          />
        </footer>
      ) : null}
    </article>
  );
}
