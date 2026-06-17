import React, { type JSX } from 'react';

import { InventarioBarChart } from '../inventario-bar-chart';
import { InventarioBarRow } from '../inventario-bar-row';
import { InventarioMetricCard } from '../inventario-metric-card';
import { InventarioPageHeader } from '../inventario-page-header';
import { InventarioPanel } from '../inventario-panel';
import { InventarioTopBar } from '../inventario-top-bar';
import type { InventarioBarChartItem, InventarioBarRowItem } from '../shared/inventario-types';
import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioDashboardPreview.module.scss';

export interface InventarioDashboardPreviewProps {
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

const metrics = [
  { label: 'Total Items', value: '1,250', accent: 'success' as const },
  { label: 'Valor Total', value: '$1.250.000.000', accent: 'info' as const },
  { label: 'Stock Bajo', value: '5 items', accent: 'warning' as const },
  { label: 'Movimientos Hoy', value: '12', accent: 'purple' as const },
];

const topProducts: InventarioBarRowItem[] = [
  { label: 'POLLO ENTERO', value: 850, progress: 100, accent: 'success' },
  { label: 'CARNE MOLIDA', value: 620, progress: 73, accent: 'success' },
  { label: 'ARROZ BLANCO', value: 580, progress: 68, accent: 'success' },
  { label: 'ACEITE VEGETAL', value: 450, progress: 53, accent: 'warning' },
  { label: 'PAPA CRIOLLA', value: 420, progress: 49, accent: 'warning' },
  { label: 'YUCA', value: 380, progress: 45, accent: 'warning' },
  { label: 'PLÁTANO', value: 340, progress: 40, accent: 'enterprise' },
  { label: 'TOMATE', value: 280, progress: 33, accent: 'enterprise' },
  { label: 'CEBOLLA', value: 220, progress: 26, accent: 'danger' },
  { label: 'CILANTRO', value: 180, progress: 21, accent: 'danger' },
];

const stockBySite: InventarioBarRowItem[] = [
  { label: 'Planta Central', value: '45%', progress: 45, accent: 'success' },
  { label: 'Sede Norte', value: '20%', progress: 20, accent: 'info' },
  { label: 'Sede Sur', value: '18%', progress: 18, accent: 'purple' },
  { label: 'Sede Este', value: '12%', progress: 12, accent: 'enterprise' },
  { label: 'Sede Oeste', value: '5%', progress: 5, accent: 'danger' },
];

const historyItems: InventarioBarChartItem[] = [
  { label: 'Día 1', value: 92 },
  { label: 'Día 5', value: 88 },
  { label: 'Día 10', value: 85 },
  { label: 'Día 15', value: 90 },
  { label: 'Día 20', value: 95 },
  { label: 'Día 25', value: 89 },
  { label: 'Día 30', value: 93 },
];

export function InventarioDashboardPreview({
  theme = 'light',
  size = 'md',
  className,
}: InventarioDashboardPreviewProps): JSX.Element {
  return (
    <div
      className={[styles.dashboard, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <InventarioTopBar theme={theme} size={size} />

      <div className={styles.content}>
        <InventarioPageHeader theme={theme} size="xl" />

        <div className={styles.metricsRow}>
          {metrics.map((metric) => (
            <InventarioMetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              accent={metric.accent}
              theme={theme}
              size="xl"
            />
          ))}
        </div>

        <div className={styles.panelsRow}>
          <InventarioPanel title="Top 10 Productos por Stock" theme={theme} size="xl">
            <div className={styles.barList}>
              {topProducts.map((item) => (
                <InventarioBarRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  progress={item.progress}
                  accent={item.accent}
                  theme={theme}
                  size="xl"
                  density="compact"
                />
              ))}
            </div>
          </InventarioPanel>

          <InventarioPanel title="Stock por Sede (%)" theme={theme} size="xl">
            <div className={styles.barList}>
              {stockBySite.map((item) => (
                <InventarioBarRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  progress={item.progress}
                  accent={item.accent}
                  theme={theme}
                  size="xl"
                  density="comfortable"
                />
              ))}
            </div>
          </InventarioPanel>
        </div>

        <InventarioPanel title="Histórico Últimos 30 Días (% Ocupación)" theme={theme} size="xl">
          <InventarioBarChart items={historyItems} theme={theme} size="xl" />
        </InventarioPanel>
      </div>
    </div>
  );
}

export default InventarioDashboardPreview;
