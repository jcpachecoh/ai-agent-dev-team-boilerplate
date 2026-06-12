import type { PayrollEmployee } from '../types/payroll.types';
import styles from '../payroll.module.scss';

interface PayrollDeactivateEmployeeDialogProps {
  employee?: PayrollEmployee;
  open: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PayrollDeactivateEmployeeDialog({
  employee,
  open,
  submitting,
  onCancel,
  onConfirm,
}: PayrollDeactivateEmployeeDialogProps): React.JSX.Element | null {
  if (!open || !employee) return null;

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onCancel}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <h2 className={styles.title}>Desactivar empleado</h2>
        </header>
        <div className={styles.modalBody}>
          <p>
            Vas a desactivar a <strong>{employee.name}</strong>. Este cambio aplica soft delete y el
            empleado dejara de aparecer en el listado por defecto.
          </p>
        </div>
        <footer className={styles.modalFooter}>
          <button className={styles.buttonSecondary} onClick={onCancel} disabled={submitting}>
            Cancelar
          </button>
          <button className={styles.buttonDanger} onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Desactivando...' : 'Confirmar desactivacion'}
          </button>
        </footer>
      </section>
    </div>
  );
}
