import type { JSX } from 'react';

import {
  BarChart,
  type BarChartSeries,
  type BarChartVariant,
} from '../../charts/bar-chart/BarChart';
import type { ChartValueType } from '../../charts/shared/types';
import { NominaLegendItem } from '../nomina-legend-item';
import { NominaPeriodToggle } from '../nomina-period-toggle';
import type { NominaPeriodMode, NominaTheme, NominaChartLegendItem } from '../shared/nomina-types';
import { getNominaLocationColor } from '../shared/nomina-utils';
import styles from './NominaChartPanel.module.scss';

export type { NominaChartLegendItem };

export interface NominaChartPanelProps {
  title: string;
  period: NominaPeriodMode;
  onPeriodChange?: (period: NominaPeriodMode) => void;
  data: Array<Record<string, string | number>>;
  xDataKey: string;
  series: BarChartSeries[];
  legend: NominaChartLegendItem[];
  variant?: BarChartVariant;
  valueType?: ChartValueType;
  theme?: NominaTheme;
  className?: string;
}

export function NominaChartPanel({
  title,
  period,
  onPeriodChange,
  data,
  xDataKey,
  series,
  legend,
  variant = 'grouped',
  valueType = 'currency',
  theme = 'dark',
  className,
}: NominaChartPanelProps): JSX.Element {
  return (
    <section
      className={[styles.panel, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {onPeriodChange ? (
          <NominaPeriodToggle theme={theme} value={period} onChange={onPeriodChange} />
        ) : null}
      </header>
      <div className={styles.chart}>
        <BarChart
          theme={theme}
          size="md"
          variant={variant}
          data={data}
          xDataKey={xDataKey}
          series={series}
          valueType={valueType}
          ariaLabel={title}
        />
      </div>
      <footer className={styles.legend}>
        {legend.map((item) => (
          <NominaLegendItem
            key={item.id}
            theme={theme}
            label={item.label}
            color={getNominaLocationColor(item.tone)}
          />
        ))}
      </footer>
    </section>
  );
}

export default NominaChartPanel;
