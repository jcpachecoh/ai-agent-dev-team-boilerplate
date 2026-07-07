import { ArrowRight, CreditCard, Lock, Mail } from 'lucide-react';
import React, { type FormEvent, type JSX, useId } from 'react';

import { Input } from '../../Input/Input';
import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import {
  WEB_SIGNUP_DOCUMENT_TYPES,
  type WebLoginSize,
  type WebLoginSurfaceProps,
  type WebLoginTheme,
  type WebSignupDocumentType,
} from '../shared/web-login-types';
import styles from './WebSignupCredentialsForm.module.scss';

export interface WebSignupCredentialsFormProps extends WebLoginSurfaceProps {
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

export function WebSignupCredentialsForm({
  email,
  cedula,
  documentType,
  password,
  onEmailChange,
  onCedulaChange,
  onDocumentTypeChange,
  onPasswordChange,
  onSubmit,
  isSubmitting = false,
  error = null,
  submitLabel = 'Crear cuenta',
  theme = 'dark',
  size = 'md',
  className,
}: WebSignupCredentialsFormProps): JSX.Element {
  const fieldId = useId();
  const emailId = `${fieldId}-email`;
  const cedulaId = `${fieldId}-cedula`;
  const documentTypeId = `${fieldId}-document-type`;
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
          autoComplete="email"
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

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={cedulaId}>
            Documento
          </label>
          <Input
            id={cedulaId}
            name="cedula"
            type="text"
            autoComplete="off"
            inputMode="numeric"
            theme={inputTheme}
            size={inputSize}
            value={cedula}
            onChange={(event) => onCedulaChange(event.target.value)}
            disabled={isSubmitting}
            error={Boolean(error)}
            aria-invalid={Boolean(error)}
            placeholder="1234567890"
            rightIcon={<CreditCard size={18} aria-hidden />}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={documentTypeId}>
            Tipo
          </label>
          <select
            id={documentTypeId}
            name="documentType"
            className={styles.select}
            value={documentType}
            onChange={(event) => onDocumentTypeChange(event.target.value as WebSignupDocumentType)}
            disabled={isSubmitting}
            aria-invalid={Boolean(error)}
          >
            {WEB_SIGNUP_DOCUMENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={passwordId}>
          Contraseña
        </label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="new-password"
          theme={inputTheme}
          size={inputSize}
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          disabled={isSubmitting}
          error={Boolean(error)}
          aria-invalid={Boolean(error)}
          placeholder="Mínimo 8 caracteres"
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
        <span>{isSubmitting ? 'Creando cuenta…' : submitLabel}</span>
        {!isSubmitting ? <ArrowRight size={18} aria-hidden /> : null}
      </button>
    </form>
  );
}
