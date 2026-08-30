import * as React from 'react';
import { Mail, Lock } from 'lucide-react';
import styles from './LoginFields.module.scss';
import { Input } from '../Input/Input';
import { PasswordRow } from '../PasswordRow/PasswordRow';
import { Checkbox } from '../Checkbox/Checkbox';

export interface LoginFieldsProps {
  email?: string;
  password?: string;
  onEmailChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  remember?: boolean;
  onRememberChange?: (checked: boolean) => void;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function LoginFields({
  email: emailProp,
  password: passwordProp,
  onEmailChange,
  onPasswordChange,
  remember: rememberProp,
  onRememberChange,
  theme = 'dark',
  size = 'md',
}: LoginFieldsProps) {
  const [email, setEmail] = React.useState(emailProp ?? '');
  const [password, setPassword] = React.useState(passwordProp ?? '');
  const [remember, setRemember] = React.useState(Boolean(rememberProp));

  React.useEffect(() => {
    if (emailProp !== undefined) setEmail(emailProp);
  }, [emailProp]);

  React.useEffect(() => {
    if (passwordProp !== undefined) setPassword(passwordProp);
  }, [passwordProp]);

  React.useEffect(() => {
    if (rememberProp !== undefined) setRemember(Boolean(rememberProp));
  }, [rememberProp]);

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    onEmailChange?.(e);
  };

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    onPasswordChange?.(e);
  };

  const handleRemember = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRemember(e.target.checked);
    onRememberChange?.(e.target.checked);
  };

  const wrapperClass = [
    styles.wrapper,
    styles[`size--${size}`],
    theme === 'dark' ? styles.dark : styles.light,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      <label className={styles.field} htmlFor="login-email">
        <div className={styles.label}>Correo electrónico</div>
        <Input
          id="login-email"
          name="email"
          placeholder="admin@palosdelena.com"
          leftIcon={<Mail />}
          value={email}
          onChange={handleEmail}
          theme={theme}
          size={size}
          autoComplete="email"
        />
      </label>

      <div className={styles.field}>
        <PasswordRow
          theme={theme}
          size={size}
          label="Contraseña"
          actionText="¿Olvidaste tu contraseña?"
        />
        <Input
          id="login-password"
          name="password"
          placeholder="Contraseña"
          type="password"
          leftIcon={<Lock />}
          value={password}
          onChange={handlePassword}
          showPasswordToggle
          theme={theme}
          size={size}
          autoComplete="current-password"
        />
      </div>

      <div className={styles.remember}>
        <Checkbox
          checked={remember}
          onChange={(v) => {
            setRemember(v);
            onRememberChange?.(v);
          }}
          theme={theme}
          label="Recordar mi sesión"
        />
      </div>
    </div>
  );
}

export default LoginFields;
