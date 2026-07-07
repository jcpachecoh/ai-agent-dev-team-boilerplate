import { ArrowLeft } from 'lucide-react';
import React, { type JSX } from 'react';

import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginDemoCredentials, WebLoginSurfaceProps } from '../shared/web-login-types';
import { WebLoginBrandLogo } from '../web-login-brand-logo';
import { WebLoginCredentialsForm } from '../web-login-credentials-form';
import styles from './WebLoginFormPanel.module.scss';

export interface WebLoginFormPanelProps extends WebLoginSurfaceProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  badgeLabel?: string;
  title?: string;
  subtitle?: string;
  demoCredentials?: WebLoginDemoCredentials;
  onUseDemo?: () => void;
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  footerHref?: string;
  footerLabel?: string;
}

export function WebLoginFormPanel({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  isSubmitting,
  error,
  badgeLabel = 'Acceso restringido',
  title = 'Bienvenido de vuelta',
  subtitle = 'Ingresa tu correo y contraseña para acceder al centro de comando.',
  demoCredentials,
  onUseDemo,
  backHref,
  onBack,
  backLabel = 'Volver al inicio',
  footerHref,
  footerLabel,
  theme = 'dark',
  size = 'md',
  className,
}: WebLoginFormPanelProps): JSX.Element {
  const showBack = Boolean(backHref ?? onBack);

  return (
    <section
      className={webLoginSurfaceClass(styles.panel, styles, { theme, size, className })}
      aria-label="Inicio de sesión"
    >
      <div className={styles.intro}>
        <WebLoginBrandLogo theme={theme} size={size} />
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <WebLoginCredentialsForm
        email={email}
        password={password}
        onEmailChange={onEmailChange}
        onPasswordChange={onPasswordChange}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        error={error}
        theme={theme}
        size={size}
      />

      {showBack ? (
        backHref ? (
          <a className={styles.back} href={backHref}>
            <ArrowLeft size={16} aria-hidden />
            {backLabel}
          </a>
        ) : (
          <button type="button" className={styles.back} onClick={onBack}>
            <ArrowLeft size={16} aria-hidden />
            {backLabel}
          </button>
        )
      ) : null}

      {footerHref && footerLabel ? (
        <p className={styles.footer}>
          <a className={styles.footerLink} href={footerHref}>
            {footerLabel}
          </a>
        </p>
      ) : null}
    </section>
  );
}
