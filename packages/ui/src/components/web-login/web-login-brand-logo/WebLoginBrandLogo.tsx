import React, { type JSX } from 'react';

import { WEB_LOGIN_BRAND_LOGO_DARK, WEB_LOGIN_BRAND_LOGO_LIGHT } from '../shared/web-login-assets';
import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginSurfaceProps } from '../shared/web-login-types';
import styles from './WebLoginBrandLogo.module.scss';

export interface WebLoginBrandLogoProps extends WebLoginSurfaceProps {
  alt?: string;
  logoDarkSrc?: string;
  logoLightSrc?: string;
}

export function WebLoginBrandLogo({
  alt = 'Palos de Leña Restaurantes',
  logoDarkSrc = WEB_LOGIN_BRAND_LOGO_DARK,
  logoLightSrc = WEB_LOGIN_BRAND_LOGO_LIGHT,
  theme = 'dark',
  size = 'md',
  className,
}: WebLoginBrandLogoProps): JSX.Element {
  const logoSrc = theme === 'light' ? logoLightSrc : logoDarkSrc;

  return (
    <div className={webLoginSurfaceClass(styles.logoWrap, styles, { theme, size, className })}>
      <img className={styles.logo} src={logoSrc} alt={alt} />
    </div>
  );
}
