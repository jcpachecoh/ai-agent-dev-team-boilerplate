import React, { type JSX } from 'react';

import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginSurfaceProps, WebSignupDocumentType } from '../shared/web-login-types';
import { WebLoginBrandLogo } from '../web-login-brand-logo';
import { WebSignupCredentialsForm } from '../web-signup-credentials-form';
import styles from './WebSignupFormPanel.module.scss';

export interface WebSignupFormPanelProps extends WebLoginSurfaceProps {
  email: string;
  cedula: string;
  documentType: WebSignupDocumentType;
  password: string;
  onEmailChange: (value: string) => void;
  onCedulaChange: (value: string) => void;
  onDocumentTypeChange: (value: WebSignupDocumentType) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  title?: string;
  subtitle?: string;
  footerHref?: string;
  footerLabel?: string;
}

export function WebSignupFormPanel({
  email,
  cedula,
  documentType,
  password,
  onEmailChange,
  onCedulaChange,
  onDocumentTypeChange,
  onPasswordChange,
  onSubmit,
  isSubmitting,
  error,
  title = 'Crea tu cuenta',
  subtitle = 'Regístrate con tu correo, documento y contraseña para acceder al sistema.',
  footerHref,
  footerLabel,
  theme = 'dark',
  size = 'md',
  className,
}: WebSignupFormPanelProps): JSX.Element {
  return (
    <section
      className={webLoginSurfaceClass(styles.panel, styles, { theme, size, className })}
      aria-label="Registro"
    >
      <div className={styles.intro}>
        <WebLoginBrandLogo theme={theme} size={size} />
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <WebSignupCredentialsForm
        email={email}
        cedula={cedula}
        documentType={documentType}
        password={password}
        onEmailChange={onEmailChange}
        onCedulaChange={onCedulaChange}
        onDocumentTypeChange={onDocumentTypeChange}
        onPasswordChange={onPasswordChange}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        error={error}
        theme={theme}
        size={size}
      />

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
