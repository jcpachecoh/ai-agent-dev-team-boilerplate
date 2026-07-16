import { Button } from '@restopsiq/ui';

import styles from './PilaExportHistory.module.scss';
import { PilaStatusBadge } from './PilaStatusBadge';
import type { PilaPeriodExport } from '../types/pila.types';
import {
  canMarkPilaPaid,
  canVoidPila,
  formatPilaDateTime,
  formatPilaMoney,
} from '../utils/pila-display';

interface Props {
  exports: PilaPeriodExport[];
  canWrite: boolean;
  downloadingId?: string | null;
  onDownload: (row: PilaPeriodExport) => void;
  onMarkPaid: (row: PilaPeriodExport) => void;
  onVoid: (row: PilaPeriodExport) => void;
}

export function PilaExportHistory({
  exports,
  canWrite,
  downloadingId = null,
  onDownload,
  onMarkPaid,
  onVoid,
}: Props): React.JSX.Element {
  if (exports.length === 0) {
    return <p className={styles.empty}>Sin versiones generadas para este período.</p>;
  }

  return (
    <div className={styles.wrap}>
      <h4 className={styles.title}>Historial de versiones</h4>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Versión</th>
              <th>Formato</th>
              <th>Estado</th>
              <th>Generado</th>
              <th>Empleados</th>
              <th>Total nómina</th>
              <th>Total aportes</th>
              <th>Pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {exports.map((row) => (
              <tr key={row.id}>
                <td>v{row.version}</td>
                <td>{row.format}</td>
                <td>
                  <PilaStatusBadge status={row.status} />
                </td>
                <td>{formatPilaDateTime(row.generatedAt)}</td>
                <td>{row.employeeCount}</td>
                <td>{formatPilaMoney(row.totalPayrollAmount)}</td>
                <td>{formatPilaMoney(row.totalContribution)}</td>
                <td>{formatPilaDateTime(row.paidAt)}</td>
                <td>
                  <div className={styles.rowActions}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      disabled={downloadingId === row.id}
                      onClick={() => onDownload(row)}
                    >
                      Descargar
                    </Button>
                    {canMarkPilaPaid(canWrite, row) ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="small"
                        onClick={() => onMarkPaid(row)}
                      >
                        Marcar pagado
                      </Button>
                    ) : null}
                    {canVoidPila(canWrite, row) ? (
                      <Button
                        type="button"
                        variant="danger"
                        size="small"
                        onClick={() => onVoid(row)}
                      >
                        Anular
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
