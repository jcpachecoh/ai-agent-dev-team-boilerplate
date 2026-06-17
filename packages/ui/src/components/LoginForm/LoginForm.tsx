import * as React from 'react';
import styles from './LoginForm.module.scss';
import { LoginFields } from '../LoginFields/LoginFields';
import { LoginTitle } from '../LoginTitle/LoginTitle';
import { Button } from '../Button/Button';

export interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

export interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => void | Promise<void>;
  initial?: Partial<LoginFormData>;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function LoginForm({
  onSubmit,
  initial = {},
  theme = 'light',
  size = 'md',
}: LoginFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState(initial.email ?? '');
  const [password, setPassword] = React.useState(initial.password ?? '');
  const [remember, setRemember] = React.useState(Boolean(initial.remember));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const payload = { email, password, remember };
    if (!onSubmit) return;
    try {
      setLoading(true);
      await onSubmit(payload);
    } finally {
      setLoading(false);
    }
  };

  const cardClass = [styles.card, theme === 'dark' ? styles.cardDark : styles.cardLight]
    .filter(Boolean)
    .join(' ');

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <LoginTitle theme={theme} />

      <div className={cardClass}>
        <LoginFields
          email={email}
          password={password}
          remember={remember}
          onEmailChange={(e) => setEmail(e.target.value)}
          onPasswordChange={(e) => setPassword(e.target.value)}
          onRememberChange={(v) => setRemember(v)}
          theme={theme}
          size={size}
        />

        <div className={styles.actions}>
          <Button
            className={styles.primaryBtn}
            type="submit"
            size="large"
            disabled={loading || !email || !password}
          >
            {loading ? 'Ingresando…' : 'Iniciar Sesión'}
          </Button>
        </div>

        <div className={styles.or}>
          <span>o también</span>
        </div>

        <div className={styles.socials}>
          <Button className={styles.socialBtn} variant="secondary" size="medium">
            Google
          </Button>
        </div>
      </div>
    </form>
  );
}

export default LoginForm;
