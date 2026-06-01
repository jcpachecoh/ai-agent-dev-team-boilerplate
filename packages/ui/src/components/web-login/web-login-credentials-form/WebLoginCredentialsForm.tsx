import { ArrowRight, CreditCard, Lock } from 'lucide-react';
import React, { type FormEvent, type JSX, useId } from 'react';

import { Input } from '../../Input/Input';
import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginSize, WebLoginSurfaceProps, WebLoginTheme } from '../shared/web-login-types';
import styles from './WebLoginCredentialsForm.module.scss';

export interface WebLoginCredentialsFormProps extends WebLoginSurfaceProps {
  cedula: string;
  pin: string;
  onCedulaChange: (value: string) => void;
  onPinChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  cedulaMaxLength?: number;
  pinMaxLength?: number;
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
  cedula,
  pin,
  onCedulaChange,
  onPinChange,
  onSubmit,
  isSubmitting = false,
  error = null,
  submitLabel = 'Acceder al sistema',
  cedulaMaxLength = 11,
  pinMaxLength = 6,
  theme = 'dark',
  size = 'md',
  className,
}: WebLoginCredentialsFormProps): JSX.Element {
  const fieldId = useId();
  const cedulaId = `${fieldId}-cedula`;
  const pinId = `${fieldId}-pin`;
  const inputSize = mapInputSize(size);
  const inputTheme = mapInputTheme(theme);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!isSubmitting) {
      onSubmit();
    }
  };

  const handleCedulaChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onCedulaChange(event.target.value.replace(/\D/g, '').slice(0, cedulaMaxLength));
  };

  const handlePinChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onPinChange(event.target.value.replace(/\D/g, '').slice(0, pinMaxLength));
  };

  return (
    <form
      className={webLoginSurfaceClass(styles.form, styles, { theme, size, className })}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor={cedulaId}>
          Cédula
        </label>
        <Input
          id={cedulaId}
          name="cedula"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          theme={inputTheme}
          size={inputSize}
          value={cedula}
          onChange={handleCedulaChange}
          disabled={isSubmitting}
          error={Boolean(error)}
          aria-invalid={Boolean(error)}
          placeholder="Número de cédula"
          rightIcon={<CreditCard size={18} aria-hidden />}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={pinId}>
          PIN
        </label>
        <Input
          id={pinId}
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          theme={inputTheme}
          size={inputSize}
          value={pin}
          onChange={handlePinChange}
          disabled={isSubmitting}
          error={Boolean(error)}
          aria-invalid={Boolean(error)}
          placeholder="PIN de acceso"
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
