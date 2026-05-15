import * as React from 'react';
import styles from './Switch.module.scss';
import Spinner from '../Spinner';

export interface SwitchProps extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
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
    styles[`variant--${variant}`],
    currentChecked ? styles.checked : '',
    disabled ? styles.disabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={cls} aria-disabled={disabled} {...props}>
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
              size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'}
              color={variant === 'default' ? '#4b3406' : undefined}
            />
          ) : null}
        </span>
      </span>
    </label>
  );
}

export default Switch;
