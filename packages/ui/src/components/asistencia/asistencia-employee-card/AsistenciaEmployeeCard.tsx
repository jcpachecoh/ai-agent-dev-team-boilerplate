import { Clock3 } from 'lucide-react';
import type { JSX } from 'react';

import { AsistenciaAvatar } from '../asistencia-avatar';
import { AsistenciaOvertimeBadge } from '../asistencia-overtime-badge';
import { AsistenciaProgressBar } from '../asistencia-progress-bar';
import { AsistenciaStatusBadge } from '../asistencia-status-badge';
import { AsistenciaStatusDot } from '../asistencia-status-dot';
import type {
  AsistenciaAvatarTone,
  AsistenciaCardHighlight,
  AsistenciaEmployeeStatus,
  AsistenciaSize,
  AsistenciaTheme,
} from '../shared/asistencia-types';
import { getAvatarToneFromName, getInitials } from '../shared/asistencia-utils';
import styles from './AsistenciaEmployeeCard.module.scss';

export interface AsistenciaEmployeeCardProps {
  id?: string;
  name: string;
  role: string;
  initials?: string;
  avatarTone?: AsistenciaAvatarTone;
  status?: AsistenciaEmployeeStatus;
  entryLabel?: string;
  shiftRange?: string;
  workedTime?: string;
  overtimeLabel?: string;
  progressPercent?: number;
  progressTone?: 'accent' | 'amber' | 'muted';
  highlight?: AsistenciaCardHighlight;
  theme?: AsistenciaTheme;
  size?: AsistenciaSize;
  className?: string;
}

export function AsistenciaEmployeeCard({
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
}: AsistenciaEmployeeCardProps): JSX.Element {
  const resolvedInitials = initials ?? getInitials(name);
  const resolvedTone = avatarTone ?? getAvatarToneFromName(name);
  const isAbsent = status === 'absent';
  const showProgress = !isAbsent && progressPercent > 0;

  return (
    <article
      className={[
        styles.card,
        styles[`theme--${theme}`],
        highlight === 'overtime' && styles['highlight--overtime'],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.header}>
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
        <div className={styles.statusDotWrap}>
          <AsistenciaStatusDot status={status} theme={theme} size={size} />
        </div>
      </div>

      <AsistenciaStatusBadge status={status} theme={theme} size={size} />

      <div className={styles.metaRow}>
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

      {workedTime || overtimeLabel || showProgress ? (
        <div className={styles.footer}>
          {workedTime || overtimeLabel ? (
            <div className={styles.metricsRow}>
              {workedTime ? (
                <p
                  className={[
                    styles.workedTime,
                    highlight === 'overtime' && styles.workedTimeOvertime,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {workedTime}
                </p>
              ) : null}
              {overtimeLabel ? (
                <AsistenciaOvertimeBadge label={overtimeLabel} theme={theme} size={size} />
              ) : null}
            </div>
          ) : null}

          {showProgress ? (
            <AsistenciaProgressBar value={progressPercent} tone={progressTone} theme={theme} />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default AsistenciaEmployeeCard;
