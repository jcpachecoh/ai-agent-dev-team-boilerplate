import type { PayrollEmployeeFormValues } from '../types/payroll.types';
import { PayrollEmployeeForm } from './PayrollEmployeeForm';
import styles from '../payroll.module.scss';

interface PayrollEmployeeCreateModalProps {
  open: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: PayrollEmployeeFormValues) => void;
}

export function PayrollEmployeeCreateModal({
  open,
  submitting,
  onClose,
  onSubmit,
}: PayrollEmployeeCreateModalProps): React.JSX.Element | null {
  if (!open) return null;

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <div>
            <h2 className={styles.title}>Nuevo empleado</h2>
            <p className={styles.subtitle}>Registro base de empleado en employeeDetails</p>
          </div>
          <button className={styles.buttonSecondary} onClick={onClose}>
            Cerrar
          </button>
        </header>
        <PayrollEmployeeForm
          mode="create"
          submitting={submitting}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </section>
    </div>
  );
}
