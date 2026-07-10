import type { NovedadStatus } from '../types/payroll-novedades.types';
import { NOVEDAD_STATUS_LABELS } from '../types/payroll-novedades.types';
import styles from './PayrollNovedadStatusBadge.module.scss';

const STATUS_CLASS: Record<NovedadStatus, string> = {
  SOLICITADA: styles.solicitada,
  PENDIENTE_SUPERVISOR: styles.pendienteSupervisor,
  PENDIENTE_RRHH: styles.pendienteRrhh,
  APROBADA: styles.aprobada,
  RECHAZADA: styles.rechazada,
};

interface Props {
  status: NovedadStatus;
}

export function PayrollNovedadStatusBadge({ status }: Props): React.JSX.Element {
  return (
    <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>
      {NOVEDAD_STATUS_LABELS[status]}
    </span>
  );
}
