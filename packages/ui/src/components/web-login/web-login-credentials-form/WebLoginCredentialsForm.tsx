import { ArrowRight, Lock, Mail } from 'lucide-react';
import React, { type FormEvent, type JSX, useId } from 'react';

import { Input } from '../../Input/Input';
import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginSize, WebLoginSurfaceProps, WebLoginTheme } from '../shared/web-login-types';
import styles from './WebLoginCredentialsForm.module.scss';

export interface WebLoginCredentialsFormProps extends WebLoginSurfaceProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  submitLabel?: string;
}

function mapInputSize(size: WebLoginSize): 'sm' | 'md' | 'lg' {
  if (size === 'sm') return 'sm';
  if (size === 'xl') return 'lg';
  return 'md';
}

function mapInputTheme(theme: WebLoginTheme): 'light' | 'dark' {
  return theme === 'light' ? 'light' : 'dark';
}

export function WebLoginCredentialsForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  isSubmitting = false,
  error = null,
  submitLabel = 'Acceder al sistema',
  theme = 'dark',
  size = 'md',
  className,
}: WebLoginCredentialsFormProps): JSX.Element {
  const fieldId = useId();
  const emailId = `${fieldId}-email`;
  const passwordId = `${fieldId}-password`;
  const inputSize = mapInputSize(size);
  const inputTheme = mapInputTheme(theme);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!isSubmitting) {
      onSubmit();
    }
  };

  return (
    <form
      className={webLoginSurfaceClass(styles.form, styles, { theme, size, className })}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor={emailId}>
          Correo electrónico
        </label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="username"
          theme={inputTheme}
          size={inputSize}
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          disabled={isSubmitting}
          error={Boolean(error)}
          aria-invalid={Boolean(error)}
          placeholder="tu@empresa.com"
          rightIcon={<Mail size={18} aria-hidden />}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={passwordId}>
          Contraseña
        </label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="current-password"
          theme={inputTheme}
          size={inputSize}
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          disabled={isSubmitting}
          error={Boolean(error)}
          aria-invalid={Boolean(error)}
          placeholder="Contraseña de acceso"
          showPasswordToggle
          rightIcon={<Lock size={18} aria-hidden />}
          className={styles.input}
        />
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        <span>{isSubmitting ? 'Verificando…' : submitLabel}</span>
        {!isSubmitting ? <ArrowRight size={18} aria-hidden /> : null}
      </button>
    </form>
  );
}
