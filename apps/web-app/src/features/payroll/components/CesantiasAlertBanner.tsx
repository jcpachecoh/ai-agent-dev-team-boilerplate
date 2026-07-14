import { Alert, Button } from '@restopsiq/ui';
import { useNavigate } from 'react-router-dom';

import { useCesantiasAlertSummaryQuery } from '../hooks/useCesantiasQuery';
import type { CesantiasDeadlineStatus } from '../types/cesantias.types';
import {
  CESANTIAS_DEADLINE_STATUS_LABELS,
  formatCesantiasDeadlineDate,
} from '../utils/cesantias-display';

const VARIANT_BY_STATUS: Record<CesantiasDeadlineStatus, 'info' | 'warning' | 'error'> = {
  PENDIENTE: 'info',
  PROXIMA_A_VENCER: 'warning',
  VENCE_HOY: 'warning',
  VENCIDA: 'error',
  // No se renderiza — pendingCount === 0 siempre oculta el banner antes de llegar aquí,
  // pero se mantiene el mapeo exhaustivo por tipos.
  COMPLETADA: 'info',
};

interface Props {
  mode?: 'inline' | 'banner';
  className?: string;
}

/**
 * OS-588 (fase 4) — se oculta automáticamente cuando no hay liquidaciones pendientes
 * (`pendingCount === 0`, incluido el estado COMPLETADA). Nunca calcula la fecha límite ni
 * los días restantes en el cliente — todo viene de GET /cesantias/alert-summary.
 */
export function CesantiasAlertBanner({
  mode = 'banner',
  className,
}: Props): React.JSX.Element | null {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCesantiasAlertSummaryQuery();

  if (isLoading || isError || !data || data.pendingCount === 0) {
    return null;
  }

  return (
    <Alert
      variant={VARIANT_BY_STATUS[data.status]}
      title={CESANTIAS_DEADLINE_STATUS_LABELS[data.status]}
      mode={mode}
      className={className}
      action={
        <Button
          variant="secondary"
          size="small"
          onClick={() => void navigate('/payroll/cesantias')}
        >
          Ver cesantías
        </Button>
      }
    >
      {data.pendingCount} {data.pendingCount === 1 ? 'liquidación' : 'liquidaciones'} de{' '}
      {data.targetYear} sin consignar — fecha límite{' '}
      {formatCesantiasDeadlineDate(data.deadlineDate)}.
    </Alert>
  );
}
