import { Moon, Sun, Wifi } from 'lucide-react';
import type { JSX, ReactNode } from 'react';

import { WebLoginBrandLogo } from '../../../web-login/web-login-brand-logo';
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
  operatorRole?: string;
  locationName?: string;
  onChangeLocation?: () => void;
  clockTime?: string;
  clockSeconds?: string;
  isOnline?: boolean;
  onLogout?: () => void;
  isLoggingOut?: boolean;
  onToggleTheme?: () => void;
  logoutSlot?: ReactNode;
}

function resolveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'OP';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

export function PlantDashboardHeader({
  statusCounts,
  operatorName = 'Operador',
  operatorRole = 'OPERADOR',
  locationName,
  onChangeLocation,
  clockSeconds,
  isOnline = true,
  onLogout,
  isLoggingOut = false,
  onToggleTheme,
  logoutSlot,
  theme = 'dark',
  size = 'md',
  className,
}: PlantDashboardHeaderProps): JSX.Element {
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
        <WebLoginBrandLogo theme={theme} size="sm" className={styles.brandLogo} />
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
        {locationName ? (
          <button
            type="button"
            className={styles.locationButton}
            onClick={onChangeLocation}
            disabled={!onChangeLocation}
            title={locationName}
            data-testid="active-location-button"
          >
            {locationName}
          </button>
        ) : null}
        <div className={styles.operatorPill} title={operatorName}>
          <span className={styles.avatar} aria-hidden>
            {resolveInitials(operatorName)}
          </span>
          <span className={styles.operatorMeta}>
            <span className={styles.operatorName}>{operatorName}</span>
            <span className={styles.operatorRole}>{operatorRole}</span>
          </span>
        </div>
        <Wifi
          className={[styles.wifi, isOnline ? styles.wifiOnline : styles.wifiOffline].join(' ')}
          size={13}
          aria-hidden
        />
        <time className={styles.clockLong}>{displaySeconds}</time>
        {onToggleTheme ? (
          <button
            type="button"
            className={styles.themeToggle}
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Activar modo día' : 'Activar modo noche'}
          >
            {theme === 'dark' ? <Sun size={14} aria-hidden /> : <Moon size={14} aria-hidden />}
          </button>
        ) : null}
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
