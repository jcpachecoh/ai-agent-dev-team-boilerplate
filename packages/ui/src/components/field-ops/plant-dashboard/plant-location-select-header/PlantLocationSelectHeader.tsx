import type { JSX } from 'react';

import { WebLoginBrandLogo } from '../../../web-login/web-login-brand-logo';
import type { PlantDashboardThemeProps } from '../shared/plant-workstation-types';
import styles from './PlantLocationSelectHeader.module.scss';

export interface PlantLocationSelectHeaderProps extends PlantDashboardThemeProps {
  operatorName?: string;
  operatorRole?: string;
  operatorInitials?: string;
}

function resolveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'OP';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

export function PlantLocationSelectHeader({
  operatorName = 'Operador',
  operatorRole = 'OPERATOR',
  operatorInitials,
  theme = 'dark',
  className,
}: PlantLocationSelectHeaderProps): JSX.Element {
  const initials = operatorInitials ?? resolveInitials(operatorName);

  return (
    <header
      className={[styles.header, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      data-testid="plant-location-select-header"
    >
      <div className={styles.brand}>
        <WebLoginBrandLogo theme={theme} size="sm" className={styles.brandLogo} />
        <span className={styles.brandSecondary}>PLANT</span>
      </div>

      <div className={styles.operatorPill}>
        <span className={styles.avatar} aria-hidden>
          {initials}
        </span>
        <span className={styles.operatorMeta}>
          <span className={styles.operatorName}>{operatorName}</span>
          <span className={styles.operatorRole}>{operatorRole}</span>
        </span>
      </div>
    </header>
  );
}

export default PlantLocationSelectHeader;
