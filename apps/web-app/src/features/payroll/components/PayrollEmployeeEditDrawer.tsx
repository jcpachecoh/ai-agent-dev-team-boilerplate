import type { PayrollEmployee, PayrollEmployeeFormValues } from '../types/payroll.types';
import { PayrollEmployeeForm } from './PayrollEmployeeForm';
import styles from '../payroll.module.scss';

interface PayrollEmployeeEditDrawerProps {
  employee?: PayrollEmployee;
  open: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: PayrollEmployeeFormValues) => void;
}

export function PayrollEmployeeEditDrawer({
  employee,
  open,
  submitting,
  onClose,
  onSubmit,
}: PayrollEmployeeEditDrawerProps): React.JSX.Element | null {
  if (!open || !employee) return null;

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
            <h2 className={styles.title}>Editar empleado</h2>
            <p className={styles.subtitle}>{employee.name}</p>
          </div>
          <button className={styles.buttonSecondary} onClick={onClose}>
            Cerrar
          </button>
        </header>
        <PayrollEmployeeForm
          mode="edit"
          initialValues={employee}
          submitting={submitting}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </section>
    </div>
  );
}
