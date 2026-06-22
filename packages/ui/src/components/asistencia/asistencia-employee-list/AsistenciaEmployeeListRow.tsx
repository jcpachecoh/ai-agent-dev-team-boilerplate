import { Clock3 } from 'lucide-react';
import type { JSX } from 'react';

import { AsistenciaAvatar } from '../asistencia-avatar';
import type { AsistenciaEmployeeCardProps } from '../asistencia-employee-card';
import { AsistenciaOvertimeBadge } from '../asistencia-overtime-badge';
import { AsistenciaProgressBar } from '../asistencia-progress-bar';
import { AsistenciaStatusBadge } from '../asistencia-status-badge';
import { AsistenciaStatusDot } from '../asistencia-status-dot';
import { getAvatarToneFromName, getInitials } from '../shared/asistencia-utils';
import styles from './AsistenciaEmployeeList.module.scss';

export interface AsistenciaEmployeeListRowProps extends AsistenciaEmployeeCardProps {}

export function AsistenciaEmployeeListRow({
  name,
  role,
  initials,
  avatarTone,
  status = 'on-shift',
  entryLabel,
  shiftRange,
  workedTime,
  overtimeLabel,
  progressPercent = 0,
  progressTone = 'accent',
  highlight = 'none',
  theme = 'dark',
  size = 'sm',
  className,
}: AsistenciaEmployeeListRowProps): JSX.Element {
  const resolvedInitials = initials ?? getInitials(name);
  const resolvedTone = avatarTone ?? getAvatarToneFromName(name);
  const isAbsent = status === 'absent';
  const showProgress = !isAbsent && progressPercent > 0;

  return (
    <article
      className={[
        styles.row,
        styles[`theme--${theme}`],
        highlight === 'overtime' && styles['highlight--overtime'],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.employee}>
        <AsistenciaAvatar
          initials={resolvedInitials}
          tone={resolvedTone}
          theme={theme}
          size={size}
        />
        <div className={styles.identity}>
          <p className={styles.name}>{name}</p>
          <p className={styles.role}>{role}</p>
        </div>
        <AsistenciaStatusDot status={status} theme={theme} size={size} className={styles.dot} />
      </div>

      <div className={styles.statusCell}>
        <AsistenciaStatusBadge status={status} theme={theme} size={size} />
      </div>

      <div className={styles.entryCell}>
        {isAbsent ? (
          <p className={styles.absentLabel}>Sin registro</p>
        ) : (
          <span className={styles.entry}>
            <Clock3 className={styles.entryIcon} aria-hidden />
            {entryLabel ?? 'Entrada —'}
          </span>
        )}
        {shiftRange ? <p className={styles.shift}>{shiftRange}</p> : null}
      </div>

      <div className={styles.timeCell}>
        {workedTime ? (
          <p
            className={[styles.workedTime, highlight === 'overtime' && styles.workedTimeOvertime]
              .filter(Boolean)
              .join(' ')}
          >
            {workedTime}
          </p>
        ) : (
          <span className={styles.timePlaceholder}>—</span>
        )}
      </div>

      <div className={styles.overtimeCell}>
        {overtimeLabel ? (
          <AsistenciaOvertimeBadge label={overtimeLabel} theme={theme} size={size} />
        ) : (
          <span className={styles.timePlaceholder}>—</span>
        )}
      </div>

      <div className={styles.progressCell}>
        {showProgress ? (
          <AsistenciaProgressBar value={progressPercent} tone={progressTone} theme={theme} />
        ) : (
          <span className={styles.timePlaceholder}>—</span>
        )}
      </div>
    </article>
  );
}

export default AsistenciaEmployeeListRow;
