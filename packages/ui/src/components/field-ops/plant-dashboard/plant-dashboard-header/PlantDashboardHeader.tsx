import { Wifi } from 'lucide-react';
import type { JSX, ReactNode } from 'react';

import { LogoutButton } from '../../logout-button';
import { PlantStatusCounters } from '../plant-status-counters';
import type {
  PlantDashboardThemeProps,
  PlantStatusCounts,
} from '../shared/plant-workstation-types';
import styles from './PlantDashboardHeader.module.scss';

export interface PlantDashboardHeaderProps extends PlantDashboardThemeProps {
  statusCounts: PlantStatusCounts;
  operatorName?: string;
  clockTime?: string;
  clockSeconds?: string;
  isOnline?: boolean;
  onLogout?: () => void;
  isLoggingOut?: boolean;
  logoutSlot?: ReactNode;
}

export function PlantDashboardHeader({
  statusCounts,
  operatorName = 'Operador',
  clockTime,
  clockSeconds,
  isOnline = true,
  onLogout,
  isLoggingOut = false,
  logoutSlot,
  theme = 'dark',
  size = 'md',
  className,
}: PlantDashboardHeaderProps): JSX.Element {
  const displayClock =
    clockTime ??
    new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const displaySeconds =
    clockSeconds ??
    new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      data-testid="plant-dashboard-header"
    >
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden>
          ◆
        </span>
        <span className={styles.brandPrimary}>RESTOPSIQ</span>
        <span className={styles.brandSecondary}>PLANT</span>
        <span className={styles.brandDivider} aria-hidden />
        <span className={styles.brandContext}>DASHBOARD</span>
      </div>

      <PlantStatusCounters
        counts={statusCounts}
        theme={theme}
        size={size}
        className={styles.counters}
      />

      <div className={styles.meta}>
        <div className={styles.metaGroup}>
          <span className={styles.syncIcon} aria-hidden>
            ↻
          </span>
          <time className={styles.clockShort}>{displayClock}</time>
        </div>
        <Wifi
          className={[styles.wifi, isOnline ? styles.wifiOnline : styles.wifiOffline].join(' ')}
          size={13}
          aria-hidden
        />
        <span className={styles.metaDivider} aria-hidden />
        <span className={styles.operatorName}>{operatorName}</span>
        <time className={styles.clockLong}>{displaySeconds}</time>
        {logoutSlot ??
          (onLogout ? (
            <LogoutButton
              theme={theme}
              size="sm"
              label="Salir"
              onClick={onLogout}
              loading={isLoggingOut}
              className={styles.logout}
              data-testid="logout-button"
            />
          ) : null)}
      </div>
    </header>
  );
}

export default PlantDashboardHeader;
