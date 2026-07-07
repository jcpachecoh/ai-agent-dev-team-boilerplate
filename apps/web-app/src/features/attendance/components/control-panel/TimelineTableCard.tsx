import { EmpleadoAvatar, resolveEmpleadoInitials } from '@restopsiq/ui';
import { MapPin } from 'lucide-react';

import type { AttendanceControlPanelTimelineRow } from '../../types/attendance.types';
import {
  formatAttendanceSourceLabel,
  formatRecordDate,
  resolveTimelineFullName,
} from '../../utils/timeline-display.utils';
import styles from './TimelineTableCard.module.scss';

export interface TimelineTableCardProps {
  row: AttendanceControlPanelTimelineRow;
  theme: 'light' | 'dark';
}

export function TimelineTableCard({ row, theme }: TimelineTableCardProps): React.JSX.Element {
  const fullName = resolveTimelineFullName(row);
  const mapUrl =
    row.latitude != null && row.longitude != null
      ? `https://www.google.com/maps?q=${row.latitude},${row.longitude}`
      : null;

  return (
    <article
      className={[
        styles.card,
        styles[`theme--${theme}`],
        row.isOutOfGeofence ? styles.outOfGeofence : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-employee-id={row.employeeId}
    >
      <header className={styles.header}>
        <EmpleadoAvatar
          initials={resolveEmpleadoInitials(fullName || row.documentNumber)}
          photoUrl={row.photoUrl ?? undefined}
          theme={theme}
          size="sm"
        />
        <div className={styles.identity}>
          <p className={styles.name}>{fullName || row.documentNumber}</p>
          <p className={styles.document}>{row.documentNumber}</p>
        </div>
      </header>

      <dl className={styles.details}>
        <div className={styles.detailRow}>
          <dt>Especialidad</dt>
          <dd>{row.especialidad}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Área</dt>
          <dd>{row.area}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Contrato</dt>
          <dd>{row.contrato}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Sede</dt>
          <dd>{row.locationName}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Último registro</dt>
          <dd>{formatRecordDate(row.lastRecordAt)}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Origen</dt>
          <dd>{formatAttendanceSourceLabel(row.source)}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>Geo</dt>
          <dd>
            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className={row.isOutOfGeofence ? styles.geoLinkDanger : styles.geoLink}
                aria-label={`Ver ubicación de ${fullName}`}
              >
                <MapPin size={16} aria-hidden />
                Ver mapa
              </a>
            ) : (
              <span className={styles.noGeo}>—</span>
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}
