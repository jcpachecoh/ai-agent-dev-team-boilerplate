import * as React from 'react';
import styles from './Switch.module.scss';
import Spinner from '../Spinner';

type SwitchVariant = 'default' | 'success' | 'danger' | 'info';
type SwitchTheme = 'light' | 'dark';

function getLoadingSpinnerColor(
  variant: SwitchVariant,
  checked: boolean,
  theme: SwitchTheme,
): string {
  if (variant === 'success' || variant === 'danger' || variant === 'info') {
    return '#ffffff';
  }
  if (checked) {
    return theme === 'dark' ? '#f2c94c' : '#e4b43a';
  }
  return '#f5f5f0';
}

export interface SwitchProps extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  variant?: 'default' | 'success' | 'danger' | 'info';
  disabled?: boolean;
  loading?: boolean;
  'aria-label'?: string;
}

export function Switch({
  checked,
  defaultChecked,
  onChange,
  size = 'md',
  theme = 'light',
  variant = 'default',
  disabled = false,
  loading = false,
  className,
  ...props
}: SwitchProps) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = React.useState<boolean>(Boolean(defaultChecked));
  const currentChecked = isControlled ? Boolean(checked) : internalChecked;

  React.useEffect(() => {
    if (!isControlled && defaultChecked !== undefined) setInternalChecked(Boolean(defaultChecked));
  }, [defaultChecked, isControlled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  };

  const cls = [
    styles.switch,
    styles[`size--${size}`],
    theme === 'dark' ? styles['theme--dark'] : styles['theme--light'],
    styles[`variant--${variant}`],
    currentChecked ? styles.checked : '',
    disabled ? styles.disabled : '',
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const spinnerSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';

  return (
    <label className={cls} aria-disabled={disabled} aria-busy={loading || undefined} {...props}>
      <input
        type="checkbox"
        className={styles.input}
        checked={currentChecked}
        defaultChecked={defaultChecked}
        onChange={handleChange}
        disabled={disabled || loading}
        aria-checked={currentChecked}
      />
      <span className={styles.track}>
        <span className={styles.thumb}>
          {loading ? (
            <Spinner
              className={styles.loadingSpinner}
              size={spinnerSize}
              theme={theme}
              color={getLoadingSpinnerColor(variant, currentChecked, theme)}
            />
          ) : null}
        </span>
      </span>
    </label>
  );
}

export default Switch;
