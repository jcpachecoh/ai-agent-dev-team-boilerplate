import React, { type JSX } from 'react';

import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginDemoCredentials, WebLoginSurfaceProps } from '../shared/web-login-types';
import { WebLoginFormPanel } from '../web-login-form-panel';
import { WebLoginImagePanel } from '../web-login-image-panel';
import styles from './WebLoginPage.module.scss';

export interface WebLoginPageProps extends WebLoginSurfaceProps {
  heroImageUrl: string;
  heroImageAlt?: string;
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  demoCredentials?: WebLoginDemoCredentials;
  onUseDemo?: () => void;
  backHref?: string;
  onBack?: () => void;
  badgeLabel?: string;
  title?: string;
  subtitle?: string;
  footerHref?: string;
  footerLabel?: string;
}

export function WebLoginPage({
  heroImageUrl,
  heroImageAlt,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  isSubmitting,
  error,
  demoCredentials,
  onUseDemo,
  backHref,
  onBack,
  badgeLabel,
  title,
  subtitle,
  footerHref,
  footerLabel,
  theme = 'dark',
  size = 'md',
  className,
}: WebLoginPageProps): JSX.Element {
  return (
    <div className={webLoginSurfaceClass(styles.page, styles, { theme, size, className })}>
      <WebLoginImagePanel
        imageUrl={heroImageUrl}
        imageAlt={heroImageAlt}
        theme={theme}
        size={size}
        className={styles.hero}
      />
      <WebLoginFormPanel
        email={email}
        password={password}
        onEmailChange={onEmailChange}
        onPasswordChange={onPasswordChange}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        error={error}
        demoCredentials={demoCredentials}
        onUseDemo={onUseDemo}
        backHref={backHref}
        onBack={onBack}
        badgeLabel={badgeLabel}
        title={title}
        subtitle={subtitle}
        footerHref={footerHref}
        footerLabel={footerLabel}
        theme={theme}
        size={size}
        className={styles.form}
      />
    </div>
  );
}
