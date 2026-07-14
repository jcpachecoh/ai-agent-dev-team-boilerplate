import { CesantiasFundChannelBadge } from './CesantiasFundChannelBadge';
import { CesantiasStatusBadge } from './CesantiasStatusBadge';
import styles from './CesantiasTable.module.scss';
import type { CesantiasLiquidation } from '../types/cesantias.types';
import { CESANTIAS_INTEREST_STATUS_LABELS, formatCurrencyCop } from '../utils/cesantias-display';

interface Props {
  items: CesantiasLiquidation[];
  totals: { cesantias: number; interest: number };
}

/**
 * OS-588 (fase 4) — solo lectura: muestra liquidaciones ya calculadas/persistidas, nunca
 * recalcula nada en el cliente. Los intereses siempre se muestran en una columna separada
 * de las cesantías (requisito funcional explícito). Nunca muestra `employeeId` — solo
 * `employeeName`, ya resuelto por el backend (ver CesantiasService.listByYear).
 */
export function CesantiasTable({ items, totals }: Props): React.JSX.Element {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Empleado</th>
            <th>Fondo</th>
            <th>Canal</th>
            <th className={styles.numeric}>Base</th>
            <th className={styles.numeric}>Días</th>
            <th className={styles.numeric}>Cesantías</th>
            <th className={styles.numeric}>Intereses</th>
            <th>Estado cesantías</th>
            <th>Estado intereses</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.employeeName}</td>
              <td>{item.fundNameSnapshot}</td>
              <td>
                <CesantiasFundChannelBadge channel={item.fundChannelSnapshot} />
              </td>
              <td className={styles.numeric}>{formatCurrencyCop(item.calculationBase)}</td>
              <td className={styles.numeric}>{item.accrualDays}</td>
              <td className={styles.numeric}>{formatCurrencyCop(item.cesantiasAmount)}</td>
              <td className={styles.numeric}>{formatCurrencyCop(item.interestAmount)}</td>
              <td>
                <CesantiasStatusBadge status={item.cesantiasStatus} />
              </td>
              <td>{CESANTIAS_INTEREST_STATUS_LABELS[item.interestStatus]}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={styles.totalsRow}>
            <td colSpan={5}>Totales</td>
            <td className={styles.numeric}>{formatCurrencyCop(String(totals.cesantias))}</td>
            <td className={styles.numeric}>{formatCurrencyCop(String(totals.interest))}</td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
