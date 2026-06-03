import styles from './ProductFormModal.module.scss';

export interface FormToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}

export function FormToggle({
  label,
  checked,
  onChange,
  ariaLabel,
}: FormToggleProps): React.JSX.Element {
  return (
    <div className={styles.toggleFieldCompact}>
      <span className={styles.toggleFieldLabel}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        className={[styles.toggle, checked ? styles.toggleOn : ''].join(' ')}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.toggleThumb} aria-hidden />
      </button>
    </div>
  );
}
