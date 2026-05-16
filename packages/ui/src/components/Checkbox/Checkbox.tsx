import * as React from 'react';
import styles from './Checkbox.module.scss';

export interface CheckboxProps extends Omit<
  React.LabelHTMLAttributes<HTMLLabelElement>,
  'onChange'
> {
  id?: string;
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
}

export function Checkbox({
  id,
  label = 'Recordar mi sesión',
  checked: checkedProp,
  onChange,
  variant = 'light',
  size = 'md',
  className,
  ...props
}: CheckboxProps) {
  const [checked, setChecked] = React.useState(Boolean(checkedProp));

  React.useEffect(() => {
    if (checkedProp !== undefined) setChecked(Boolean(checkedProp));
  }, [checkedProp]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.checked;
    setChecked(v);
    onChange?.(v);
  };

  const cls = [
    styles.wrapper,
    variant === 'dark' ? styles.dark : styles.light,
    size === 'sm' ? styles.sm : styles.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputId = id ?? `checkbox-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <label className={cls} htmlFor={inputId} {...props}>
      <input
        id={inputId}
        className={styles.input}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
      />
      <span className={styles.box} aria-hidden />
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}

export default Checkbox;
