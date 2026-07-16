import {
  EmpleadoPagination,
  EmpleadoTableHeader,
  type EmpleadoPaginationProps,
  type EmpleadoTheme,
} from '@restopsiq/ui';
import type { CSSProperties } from 'react';

import type { CesantiasLiquidation } from '../types/cesantias.types';
import {
  CESANTIAS_TABLE_COLUMNS,
  getCesantiasGridTemplate,
  getCesantiasTableMinWidthPx,
} from '../utils/cesantias-table.columns';
import { CesantiasTableRow } from './CesantiasTableRow';
import { CesantiasTableTotalsRow } from './CesantiasTableTotalsRow';
import styles from './CesantiasTable.module.scss';

interface Props {
  items: CesantiasLiquidation[];
  totals: { cesantias: number; interest: number };
  theme: EmpleadoTheme;
  pagination?: EmpleadoPaginationProps;
}

/**
 * OS-588 (fase 4) — solo lectura: muestra liquidaciones ya calculadas/persistidas, nunca
 * recalcula nada en el cliente. Los intereses siempre se muestran en una columna separada
 * de las cesantías (requisito funcional explícito). Nunca muestra `employeeId` — solo
 * `employeeName`, ya resuelto por el backend (ver CesantiasService.listByYear).
 */
export function CesantiasTable({ items, totals, theme, pagination }: Props): React.JSX.Element {
  const gridTemplate = getCesantiasGridTemplate();

  return (
    <section className={styles.table} role="table" aria-label="Liquidaciones de cesantías">
      <div className={styles.scrollRegion}>
        <div
          className={styles.scrollContent}
          style={
            {
              '--empleado-columns': gridTemplate,
              '--empleado-table-min-width': `${getCesantiasTableMinWidthPx()}px`,
            } as CSSProperties
          }
        >
          <EmpleadoTableHeader
            columns={CESANTIAS_TABLE_COLUMNS}
            theme={theme}
            className={styles.desktopHeader}
          />
          <div className={styles.body} role="rowgroup">
            {items.map((item) => (
              <CesantiasTableRow key={item.id} item={item} gridTemplate={gridTemplate} />
            ))}
            <CesantiasTableTotalsRow totals={totals} gridTemplate={gridTemplate} />
          </div>
        </div>
      </div>
      {pagination ? <EmpleadoPagination theme={theme} {...pagination} /> : null}
    </section>
  );
}
