import styles from './SettlementLinesTable.module.scss';
import type { SettlementLine, SettlementPreviewLine } from '../types/final-settlement.types';
import { formatCurrencyCop } from '../utils/final-settlement-display';

interface Props {
  lines: Array<SettlementLine | SettlementPreviewLine>;
  grossDevengados: string;
  totalDeducciones: string;
  netAmount: string;
  netNegativeAmount?: string;
}

/**
 * OS-591 (fase 4) — muestra el desglose de `SettlementLine` tal cual lo devuelve el
 * backend (preview o persistido). Nunca recalcula montos ni reordena por su cuenta.
 */
export function SettlementLinesTable({
  lines,
  grossDevengados,
  totalDeducciones,
  netAmount,
  netNegativeAmount,
}: Props): React.JSX.Element {
  const devengos = lines.filter((line) => line.type === 'DEVENGO');
  const deducciones = lines.filter((line) => line.type === 'DEDUCCION');
  const hasNegative = Boolean(netNegativeAmount) && netNegativeAmount !== '0.00';

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Código</th>
            <th>Concepto</th>
            <th>Origen</th>
            <th className={styles.numeric}>Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.groupRow}>
            <td colSpan={4}>Devengos</td>
          </tr>
          {devengos.length === 0 ? (
            <tr>
              <td colSpan={4} className={styles.empty}>
                Sin devengos
              </td>
            </tr>
          ) : (
            devengos.map((line, index) => (
              <tr key={`${line.code}-${index}`}>
                <td>{line.code}</td>
                <td>
                  {line.name}
                  {line.manualJustification ? (
                    <span className={styles.justification}> · {line.manualJustification}</span>
                  ) : null}
                </td>
                <td>{line.origin === 'MANUAL' ? 'Manual' : 'Automático'}</td>
                <td className={styles.numeric}>{formatCurrencyCop(line.amount)}</td>
              </tr>
            ))
          )}

          <tr className={styles.groupRow}>
            <td colSpan={4}>Deducciones</td>
          </tr>
          {deducciones.length === 0 ? (
            <tr>
              <td colSpan={4} className={styles.empty}>
                Sin deducciones
              </td>
            </tr>
          ) : (
            deducciones.map((line, index) => (
              <tr key={`${line.code}-${index}`}>
                <td>{line.code}</td>
                <td>
                  {line.name}
                  {line.manualJustification ? (
                    <span className={styles.justification}> · {line.manualJustification}</span>
                  ) : null}
                </td>
                <td>{line.origin === 'MANUAL' ? 'Manual' : 'Automático'}</td>
                <td className={styles.numeric}>{formatCurrencyCop(line.amount)}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Total devengos</td>
            <td className={styles.numeric}>{formatCurrencyCop(grossDevengados)}</td>
          </tr>
          <tr>
            <td colSpan={3}>Total deducciones</td>
            <td className={styles.numeric}>{formatCurrencyCop(totalDeducciones)}</td>
          </tr>
          <tr className={styles.totalsRow}>
            <td colSpan={3}>Neto a pagar</td>
            <td className={styles.numeric}>{formatCurrencyCop(netAmount)}</td>
          </tr>
          {hasNegative ? (
            <tr className={styles.negativeRow}>
              <td colSpan={3}>Saldo a cargo del empleado</td>
              <td className={styles.numeric}>{formatCurrencyCop(netNegativeAmount)}</td>
            </tr>
          ) : null}
        </tfoot>
      </table>
    </div>
  );
}
