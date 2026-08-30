import React, { type JSX } from 'react';

import { InventarioDistributionBar } from '../inventario-distribution-bar';
import { InventarioExportActions } from '../inventario-export-actions';
import { InventarioPageHeader } from '../inventario-page-header';
import { InventarioPanel } from '../inventario-panel';
import { InventarioReportDataTable } from '../inventario-report-data-table';
import { InventarioReportFilterBar } from '../inventario-report-filter-bar';
import { InventarioSummaryStat } from '../inventario-summary-stat';
import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioReportsPreview.module.scss';

export interface InventarioReportsPreviewProps {
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

const distribution = [
  { label: 'Carnes', value: '35%', progress: 35, accent: 'success' as const },
  { label: 'Granos', value: '25%', progress: 25, accent: 'info' as const },
  { label: 'Tubérculos', value: '20%', progress: 20, accent: 'purple' as const },
  { label: 'Aceites', value: '12%', progress: 12, accent: 'enterprise' as const },
  { label: 'Vegetales', value: '8%', progress: 8, accent: 'danger' as const },
];

const summaryStats = [
  { label: 'Items Totales', value: '5,000', accent: 'success' as const },
  { label: 'Valor Promedio', value: '$12,500', accent: 'info' as const },
  { label: 'Movimientos', value: '245', accent: 'purple' as const },
  { label: 'Rotación', value: '8.5 días', accent: 'enterprise' as const },
];

export function InventarioReportsPreview({
  theme = 'light',
  size = 'md',
  className,
}: InventarioReportsPreviewProps): JSX.Element {
  return (
    <div
      className={[styles.screen, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.content}>
        <InventarioPageHeader
          title="Reportes de Inventario"
          subtitle="Genera reportes personalizados y exporta en CSV o PDF"
          theme={theme}
          size="xl"
        />

        <InventarioExportActions theme={theme} size={size} />

        <InventarioReportFilterBar theme={theme} size={size} />

        <div className={styles.dataSection}>
          <InventarioReportDataTable theme={theme} size="xl" className={styles.dataTable} />
          <InventarioPanel
            title="Visualización"
            theme={theme}
            size="xl"
            className={styles.visualPanel}
          >
            <div className={styles.distributionList}>
              {distribution.map((item) => (
                <InventarioDistributionBar key={item.label} theme={theme} size="xl" {...item} />
              ))}
            </div>
          </InventarioPanel>
        </div>

        <InventarioPanel title="Resumen del Período" theme={theme} size="xl">
          <div className={styles.statsRow}>
            {summaryStats.map((stat) => (
              <InventarioSummaryStat key={stat.label} theme={theme} size="xl" {...stat} />
            ))}
          </div>
        </InventarioPanel>
      </div>
    </div>
  );
}

export default InventarioReportsPreview;
