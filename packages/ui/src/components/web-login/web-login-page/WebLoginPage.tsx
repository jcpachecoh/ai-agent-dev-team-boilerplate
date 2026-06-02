import React, { type JSX, type ReactNode } from 'react';

import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginDemoCredentials, WebLoginSurfaceProps } from '../shared/web-login-types';
import { WebLoginFormPanel } from '../web-login-form-panel';
import { WebLoginHeroPanel } from '../web-login-hero-panel';
import styles from './WebLoginPage.module.scss';

export interface WebLoginPageProps extends WebLoginSurfaceProps {
  brandName?: string;
  brandLocation?: string;
  brandInitial?: string;
  headline?: string;
  description?: string;
  statusLine?: string;
  heroLogo?: ReactNode;
  heroImageUrl?: string;
  cedula: string;
  pin: string;
  onCedulaChange: (value: string) => void;
  onPinChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  demoCredentials?: WebLoginDemoCredentials;
  onUseDemo?: () => void;
  backHref?: string;
  onBack?: () => void;
}

export function WebLoginPage({
  brandName,
  brandLocation,
  brandInitial,
  headline,
  description,
  statusLine,
  heroLogo,
  heroImageUrl,
  cedula,
  pin,
  onCedulaChange,
  onPinChange,
  onSubmit,
  isSubmitting,
  error,
  demoCredentials,
  onUseDemo,
  backHref,
  onBack,
  theme = 'dark',
  size = 'md',
  className,
}: WebLoginPageProps): JSX.Element {
  return (
    <div className={webLoginSurfaceClass(styles.page, styles, { theme, size, className })}>
      <WebLoginHeroPanel
        brandName={brandName}
        brandLocation={brandLocation}
        brandInitial={brandInitial}
        headline={headline}
        description={description}
        statusLine={statusLine}
        logo={heroLogo}
        heroImageUrl={heroImageUrl}
        theme={theme}
        size={size}
        className={styles.hero}
      />
      <WebLoginFormPanel
        cedula={cedula}
        pin={pin}
        onCedulaChange={onCedulaChange}
        onPinChange={onPinChange}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        error={error}
        demoCredentials={demoCredentials}
        onUseDemo={onUseDemo}
        backHref={backHref}
        onBack={onBack}
        theme={theme}
        size={size}
        className={styles.form}
      />
    </div>
  );
}
