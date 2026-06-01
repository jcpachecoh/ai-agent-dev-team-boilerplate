import { ArrowLeft } from 'lucide-react';
import React, { type JSX } from 'react';

import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginDemoCredentials, WebLoginSurfaceProps } from '../shared/web-login-types';
import { WebLoginCredentialsForm } from '../web-login-credentials-form';
import { WebLoginDemoPanel } from '../web-login-demo-panel';
import styles from './WebLoginFormPanel.module.scss';

export interface WebLoginFormPanelProps extends WebLoginSurfaceProps {
  cedula: string;
  pin: string;
  onCedulaChange: (value: string) => void;
  onPinChange: (value: string) => void;
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
}

export function WebLoginFormPanel({
  cedula,
  pin,
  onCedulaChange,
  onPinChange,
  onSubmit,
  isSubmitting,
  error,
  badgeLabel = 'Acceso restringido',
  title = 'Bienvenido de vuelta',
  subtitle = 'Ingresa tus credenciales para acceder al centro de comando.',
  demoCredentials,
  onUseDemo,
  backHref,
  onBack,
  backLabel = 'Volver al inicio',
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
        <span className={styles.badge}>{badgeLabel}</span>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <WebLoginCredentialsForm
        cedula={cedula}
        pin={pin}
        onCedulaChange={onCedulaChange}
        onPinChange={onPinChange}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        error={error}
        theme={theme}
        size={size}
      />

      {demoCredentials ? (
        <WebLoginDemoPanel
          credentials={demoCredentials}
          onUseDemo={onUseDemo}
          theme={theme}
          size={size}
        />
      ) : null}

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
    </section>
  );
}
