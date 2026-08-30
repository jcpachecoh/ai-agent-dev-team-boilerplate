import { EmpleadoAvatar, resolveEmpleadoInitials } from '@restopsiq/ui';
import { MapPin } from 'lucide-react';

import type { AttendanceControlPanelTimelineRow } from '../../types/attendance.types';
import {
  formatAttendanceSourceLabel,
  formatRecordDate,
  resolveTimelineFullName,
} from '../../utils/timeline-display.utils';
import styles from './TimelineTableRow.module.scss';

export interface TimelineTableRowProps {
  row: AttendanceControlPanelTimelineRow;
  theme: 'light' | 'dark';
}

export function TimelineTableRow({ row, theme }: TimelineTableRowProps): React.JSX.Element {
  const fullName = resolveTimelineFullName(row);
  const mapUrl =
    row.latitude != null && row.longitude != null
      ? `https://www.google.com/maps?q=${row.latitude},${row.longitude}`
      : null;

  return (
    <tr className={row.isOutOfGeofence ? styles.outOfGeofenceRow : undefined}>
      <td>
        <EmpleadoAvatar
          initials={resolveEmpleadoInitials(fullName || row.documentNumber)}
          photoUrl={row.photoUrl ?? undefined}
          theme={theme}
          size="sm"
        />
      </td>
      <td>{row.documentNumber}</td>
      <td>{row.primerApellido ?? '—'}</td>
      <td>{row.nombres ?? '—'}</td>
      <td>{row.especialidad}</td>
      <td>{row.area}</td>
      <td>{row.contrato}</td>
      <td>{formatRecordDate(row.lastRecordAt)}</td>
      <td>{formatAttendanceSourceLabel(row.source)}</td>
      <td>
        {mapUrl ? (
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className={row.isOutOfGeofence ? styles.geoLinkDanger : styles.geoLink}
            aria-label={`Ver ubicación de ${fullName}`}
          >
            <MapPin size={16} aria-hidden />
          </a>
        ) : (
          <span className={styles.noGeo}>—</span>
        )}
      </td>
    </tr>
  );
}
