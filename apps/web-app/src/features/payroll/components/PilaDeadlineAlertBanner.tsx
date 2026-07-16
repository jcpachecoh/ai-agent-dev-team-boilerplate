import { Alert, Button } from '@restopsiq/ui';
import { useNavigate } from 'react-router-dom';

import { usePilaDeadlineQuery } from '../hooks/usePilaExportQueries';
import type { PilaDeadlineStatus } from '../types/pila.types';
import { formatPilaDeadlineDate, PILA_DEADLINE_STATUS_LABELS } from '../utils/pila-display';

const VARIANT_BY_STATUS: Record<PilaDeadlineStatus, 'info' | 'warning' | 'error'> = {
  NOT_DUE: 'info',
  UPCOMING: 'warning',
  DUE_TODAY: 'warning',
  OVERDUE: 'error',
  PAID: 'info',
  CONFIG_INCOMPLETE: 'warning',
};

interface Props {
  period: string;
  mode?: 'inline' | 'banner';
  className?: string;
}

/**
 * OS-595 — alerta de vencimiento PILA.
 * No calcula la fecha en el cliente: consume GET /reports/pila/:period/deadline.
 * Se oculta si no hay alerta (`shouldAlert=false`), p.ej. PAID o NOT_DUE.
 */
export function PilaDeadlineAlertBanner({
  period,
  mode = 'banner',
  className,
}: Props): React.JSX.Element | null {
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePilaDeadlineQuery(period);

  if (isLoading || isError || !data) {
    return null;
  }

  if (data.status === 'CONFIG_INCOMPLETE') {
    return (
      <Alert
        variant="warning"
        title="Configuración PILA incompleta"
        mode={mode}
        className={className}
        action={
          <Button
            variant="secondary"
            size="small"
            onClick={() => void navigate('/payroll/reports')}
          >
            Ir a reportes PILA
          </Button>
        }
      >
        {data.message ?? 'Configure el NIT del empleador para calcular la fecha límite de aportes.'}
      </Alert>
    );
  }

  if (!data.shouldAlert || data.status === 'PAID') {
    return null;
  }

  const daysLabel =
    data.daysRemaining === null
      ? ''
      : data.daysRemaining < 0
        ? `Venció hace ${Math.abs(data.daysRemaining)} día(s)`
        : data.daysRemaining === 0
          ? 'Vence hoy'
          : `${data.daysRemaining} día(s) restante(s)`;

  return (
    <Alert
      variant={VARIANT_BY_STATUS[data.status]}
      title={PILA_DEADLINE_STATUS_LABELS[data.status]}
      mode={mode}
      className={className}
      action={
        <Button variant="secondary" size="small" onClick={() => void navigate('/payroll/reports')}>
          Ir a PILA
        </Button>
      }
    >
      Período {data.period} — fecha límite {formatPilaDeadlineDate(data.dueDate)}
      {daysLabel ? ` · ${daysLabel}` : ''}. Estado actual:{' '}
      {PILA_DEADLINE_STATUS_LABELS[data.status]}.
    </Alert>
  );
}
