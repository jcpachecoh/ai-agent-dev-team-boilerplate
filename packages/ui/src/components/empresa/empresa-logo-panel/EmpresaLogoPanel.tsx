import React, { type JSX } from 'react';

import {
  WEB_LOGIN_BRAND_LOGO_DARK,
  WEB_LOGIN_BRAND_LOGO_LIGHT,
} from '../../web-login/shared/web-login-assets';
import type { EmpresaSize, EmpresaTheme } from '../shared/empresa-types';
import styles from './EmpresaLogoPanel.module.scss';

export interface EmpresaLogoPanelProps {
  alt?: string;
  logoDarkSrc?: string;
  logoLightSrc?: string;
  theme?: EmpresaTheme;
  size?: EmpresaSize;
  className?: string;
}

export function EmpresaLogoPanel({
  alt = 'Logo del restaurante',
  logoDarkSrc = WEB_LOGIN_BRAND_LOGO_DARK,
  logoLightSrc = WEB_LOGIN_BRAND_LOGO_LIGHT,
  theme = 'dark',
  size = 'md',
  className,
}: EmpresaLogoPanelProps): JSX.Element {
  const logoSrc = theme === 'light' ? logoLightSrc : logoDarkSrc;

  return (
    <div
      className={[styles.panel, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.logoBox}>
        <img className={styles.logoImage} src={logoSrc} alt={alt} />
      </div>
    </div>
  );
}

export default EmpresaLogoPanel;
