import { Button, Input, WEB_LOGIN_HERO_IMAGE, WebLoginImagePanel } from '@restopsiq/ui';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

import styles from './ActivateAccountPageView.module.scss';

export interface ActivateAccountPageViewProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  success?: string | null;
  missingToken?: boolean;
  heroImageUrl?: string;
}

export function ActivateAccountPageView({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  isSubmitting = false,
  error = null,
  success = null,
  missingToken = false,
  heroImageUrl = import.meta.env.VITE_LOGIN_HERO_IMAGE ?? WEB_LOGIN_HERO_IMAGE,
}: ActivateAccountPageViewProps): React.JSX.Element {
  return (
    <div className={styles.page}>
      <WebLoginImagePanel imageUrl={heroImageUrl} theme="dark" size="md" />
      <section className={styles.panel}>
        <div className={styles.content}>
          <h1 className={styles.title}>Configura tu contraseña</h1>
          <p className={styles.subtitle}>
            Confirma tu cuenta y define la contraseña con la que ingresarás a RestOpsIQ.
          </p>

          {missingToken ? (
            <p className={styles.errorText}>
              El enlace de confirmación no es válido. Solicita uno nuevo al administrador de tu
              restaurante.
            </p>
          ) : (
            <form
              className={styles.form}
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
            >
              <label className={styles.field} htmlFor="activate-password">
                <span className={styles.label}>Nueva contraseña</span>
                <Input
                  id="activate-password"
                  type="password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  leftIcon={<Lock size={16} />}
                  showPasswordToggle
                  theme="dark"
                  size="md"
                  autoComplete="new-password"
                />
              </label>

              <label className={styles.field} htmlFor="activate-confirm-password">
                <span className={styles.label}>Confirmar contraseña</span>
                <Input
                  id="activate-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => onConfirmPasswordChange(event.target.value)}
                  leftIcon={<Lock size={16} />}
                  showPasswordToggle
                  theme="dark"
                  size="md"
                  autoComplete="new-password"
                />
              </label>

              {error ? <p className={styles.errorText}>{error}</p> : null}
              {success ? <p className={styles.successText}>{success}</p> : null}

              <Button
                type="submit"
                variant="primary"
                size="medium"
                disabled={isSubmitting || Boolean(success)}
                className={styles.submitButton}
              >
                {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
              </Button>
            </form>
          )}

          <Link className={styles.footerLink} to="/login">
            Ir al inicio de sesión
          </Link>
        </div>
      </section>
    </div>
  );
}
