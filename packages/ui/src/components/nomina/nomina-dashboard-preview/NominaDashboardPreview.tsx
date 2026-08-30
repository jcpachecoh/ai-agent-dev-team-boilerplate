import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock3,
  DollarSign,
  FileText,
  Users,
} from 'lucide-react';

import type { BarChartSeries, BarChartVariant } from '../../charts/bar-chart/BarChart';
import type { ChartValueType } from '../../charts/shared/types';
import { NominaChartPanel } from '../nomina-chart-panel';
import { NominaKpiCard } from '../nomina-kpi-card';
import { NominaLegalAlertsPanel } from '../nomina-legal-alerts-panel';
import { NominaLocationBreakdown } from '../nomina-location-breakdown';
import { NominaClosingBadge, NominaPageHeader } from '../nomina-page-header';
import { NominaReportList } from '../nomina-report-list';
import {
  NOMINA_DEMO_CHART_DATA,
  NOMINA_DEMO_CHART_LEGEND,
  NOMINA_DEMO_CHART_SERIES,
  NOMINA_DEMO_KPI_METRICS,
  NOMINA_DEMO_LOCATION_ROWS,
  NOMINA_DEMO_REPORTS,
} from '../shared/nomina-demo-data';
import type {
  NominaChartLegendItem,
  NominaKpiMetric,
  NominaLegalAlertItem,
  NominaLocationBreakdownRow,
  NominaPeriodMode,
  NominaReportDefinition,
  NominaTheme,
} from '../shared/nomina-types';
import styles from './NominaDashboardPreview.module.scss';

const KPI_ICONS: Record<string, ReactNode> = {
  payroll: <DollarSign />,
  overtime: <Clock3 />,
  employees: <Users />,
  alerts: <AlertTriangle />,
};

const REPORT_ICONS: Record<string, ReactNode> = {
  'nom-01': <Users />,
  'nom-02': <FileText />,
  'nom-03': <Calendar />,
  'nom-04': <BarChart3 />,
  'nom-04-pdf': <FileText />,
  'nom-04-xlsx': <BarChart3 />,
};

export interface NominaDashboardPreviewProps {
  theme?: NominaTheme;
  metrics?: NominaKpiMetric[];
  closingBadgeLabel?: string;
  chartTitle?: string;
  chartData?: Array<Record<string, string | number>>;
  chartXDataKey?: string;
  chartSeries?: BarChartSeries[];
  chartLegend?: NominaChartLegendItem[];
  chartVariant?: BarChartVariant;
  chartValueType?: ChartValueType;
  period?: NominaPeriodMode;
  onPeriodChange?: (period: NominaPeriodMode) => void;
  locationRows?: NominaLocationBreakdownRow[];
  locationTitle?: string;
  legalAlertsEmptyTitle?: string;
  legalAlertsEmptyDescription?: string;
  legalAlertsItems?: NominaLegalAlertItem[];
  reports?: NominaReportDefinition[];
  onReportDownload?: (item: NominaReportDefinition) => void;
  filtersBar?: ReactNode;
  showPeriodToggle?: boolean;
  className?: string;
}

export function NominaDashboardPreview({
  theme = 'dark',
  metrics = NOMINA_DEMO_KPI_METRICS,
  closingBadgeLabel = 'Cierre: 30 jun',
  chartTitle = 'Nómina estimada por sede',
  chartData = NOMINA_DEMO_CHART_DATA,
  chartXDataKey = 'week',
  chartSeries = NOMINA_DEMO_CHART_SERIES,
  chartLegend = NOMINA_DEMO_CHART_LEGEND,
  chartVariant = 'grouped',
  chartValueType = 'currency',
  period: periodProp,
  onPeriodChange,
  locationRows = NOMINA_DEMO_LOCATION_ROWS,
  locationTitle = 'Por sede',
  legalAlertsEmptyTitle = 'Sin alertas activas',
  legalAlertsEmptyDescription = 'Todos los contratos y marcaciones cumplen con la normativa vigente.',
  legalAlertsItems,
  reports = NOMINA_DEMO_REPORTS,
  onReportDownload,
  filtersBar,
  showPeriodToggle = true,
  className,
}: NominaDashboardPreviewProps): JSX.Element {
  const [internalPeriod, setInternalPeriod] = useState<NominaPeriodMode>('month');
  const period = periodProp ?? internalPeriod;

  const handlePeriodChange = (next: NominaPeriodMode): void => {
    if (onPeriodChange) {
      onPeriodChange(next);
      return;
    }
    setInternalPeriod(next);
  };

  return (
    <div className={[styles.page, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}>
      <NominaPageHeader
        theme={theme}
        title="Reportes de nómina"
        subtitle="Métricas consolidadas por sede y periodo"
        badge={<NominaClosingBadge theme={theme} label={closingBadgeLabel} />}
      />

      <section className={styles.kpiSection}>
        <div className={styles.kpiGrid}>
          {metrics.map((metric) => (
            <NominaKpiCard
              key={metric.id}
              theme={theme}
              title={metric.title}
              value={metric.value}
              description={metric.description}
              tone={metric.tone}
              icon={KPI_ICONS[metric.id]}
            />
          ))}
        </div>
      </section>

      {filtersBar ? <section className={styles.filtersSection}>{filtersBar}</section> : null}

      <div className={styles.main}>
        <div className={styles.primary}>
          <NominaChartPanel
            theme={theme}
            title={chartTitle}
            period={period}
            onPeriodChange={showPeriodToggle ? handlePeriodChange : undefined}
            data={chartData}
            xDataKey={chartXDataKey}
            series={chartSeries}
            legend={chartLegend}
            variant={chartVariant}
            valueType={chartValueType}
          />
          <NominaLocationBreakdown theme={theme} title={locationTitle} rows={locationRows} />
        </div>

        <aside className={styles.sidebar}>
          <NominaLegalAlertsPanel
            theme={theme}
            items={legalAlertsItems}
            emptyTitle={legalAlertsEmptyTitle}
            emptyDescription={legalAlertsEmptyDescription}
          />
          <NominaReportList
            theme={theme}
            items={reports}
            renderIcon={(item) => REPORT_ICONS[item.id]}
            onDownload={onReportDownload}
          />
        </aside>
      </div>
    </div>
  );
}

export default NominaDashboardPreview;
