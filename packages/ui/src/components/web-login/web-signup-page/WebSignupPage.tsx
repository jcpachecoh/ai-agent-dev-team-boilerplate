import React, { type JSX } from 'react';

import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginSurfaceProps, WebSignupDocumentType } from '../shared/web-login-types';
import { WebLoginImagePanel } from '../web-login-image-panel';
import { WebSignupFormPanel } from '../web-signup-form-panel';
import styles from './WebSignupPage.module.scss';

export interface WebSignupPageProps extends WebLoginSurfaceProps {
  heroImageUrl: string;
  heroImageAlt?: string;
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
  footerHref?: string;
  footerLabel?: string;
  title?: string;
  subtitle?: string;
}

export function WebSignupPage({
  heroImageUrl,
  heroImageAlt,
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
  footerHref,
  footerLabel,
  title,
  subtitle,
  theme = 'dark',
  size = 'md',
  className,
}: WebSignupPageProps): JSX.Element {
  return (
    <div className={webLoginSurfaceClass(styles.page, styles, { theme, size, className })}>
      <WebLoginImagePanel
        imageUrl={heroImageUrl}
        imageAlt={heroImageAlt}
        theme={theme}
        size={size}
        className={styles.hero}
      />
      <WebSignupFormPanel
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
        footerHref={footerHref}
        footerLabel={footerLabel}
        title={title}
        subtitle={subtitle}
        theme={theme}
        size={size}
        className={styles.form}
      />
    </div>
  );
}
