import styles from './PayrollEmployeeProfileTabLoading.module.scss';

interface PayrollEmployeeProfileTabLoadingProps {
  label?: string;
}

export function PayrollEmployeeProfileTabLoading({
  label = 'Cargando',
}: PayrollEmployeeProfileTabLoadingProps): React.JSX.Element {
  return (
    <div className={styles.loadingState} role="status" aria-live="polite" aria-label={label}>
      <div className={styles.spinner} aria-hidden />
      <p className={styles.loadingLabel}>{label}</p>
    </div>
  );
}
