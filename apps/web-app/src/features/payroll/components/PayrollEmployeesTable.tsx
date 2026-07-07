import { StatusBadge } from '@restopsiq/ui';

import type { PayrollEmployee } from '../types/payroll.types';
import styles from '../payroll.module.scss';

interface PayrollEmployeesTableProps {
  employees: PayrollEmployee[];
  onEdit: (employee: PayrollEmployee) => void;
  onDeactivate: (employee: PayrollEmployee) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString('es-CO');
}

export function PayrollEmployeesTable({
  employees,
  onEdit,
  onDeactivate,
}: PayrollEmployeesTableProps): React.JSX.Element {
  return (
    <section className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cedula</th>
            <th>Email</th>
            <th>Cargo</th>
            <th>Contrato</th>
            <th>Sede</th>
            <th>Ingreso</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.name}</td>
              <td>{employee.user?.cedula ?? '-'}</td>
              <td>{employee.user?.email ?? '-'}</td>
              <td>{employee.position}</td>
              <td>{employee.contractType}</td>
              <td>{employee.location?.name ?? employee.locationId ?? '-'}</td>
              <td>{formatDate(employee.hireDate)}</td>
              <td>
                <StatusBadge
                  status={employee.isActive ? 'ACTIVE' : 'INACTIVE'}
                  variant="pill"
                  size="sm"
                />
              </td>
              <td>
                <div className={styles.actions}>
                  <button className={styles.buttonSecondary} onClick={() => onEdit(employee)}>
                    Editar
                  </button>
                  <button
                    className={styles.buttonDanger}
                    onClick={() => onDeactivate(employee)}
                    disabled={!employee.isActive}
                  >
                    Desactivar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
