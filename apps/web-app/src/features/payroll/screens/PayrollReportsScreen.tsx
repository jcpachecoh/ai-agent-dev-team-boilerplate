import {
  LoadingState,
  NominaDashboardPreview,
  type NominaPeriodMode,
  type NominaReportDefinition,
  toast,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';

import { useTheme } from '@/providers/ThemeProvider';
import { exportPayrollReport, PayrollApiError } from '../api/payroll.client';
import { useAttendanceReportQuery, usePayrollReportQuery } from '../hooks/usePayrollReportQueries';
import {
  formatClosingBadgeLabel,
  getCurrentPayrollPeriod,
  getCurrentWeekDateRange,
  getMonthDateRange,
  mapLocationRows,
  mapLegalAlertItems,
  mapPayrollChartData,
  mapPayrollKpiMetrics,
} from '../utils/mapPayrollReportToNomina';
import styles from './PayrollReportsScreen.module.scss';

const REPORT_ITEMS: NominaReportDefinition[] = [
  {
    id: 'nom-01',
    code: 'NOM-01',
    title: 'Empleados',
    description: 'Listado completo con datos contractuales',
    tone: 'accent',
  },
  {
    id: 'nom-02',
    code: 'NOM-02',
    title: 'Contratos',
    description: 'Vigencia, tipo y condiciones laborales',
    tone: 'purple',
  },
  {
    id: 'nom-03',
    code: 'NOM-03',
    title: 'Asistencia',
    description: 'Marcaciones y horas extras del periodo',
    tone: 'teal',
  },
  {
    id: 'nom-04-pdf',
    code: 'NOM-04',
    title: 'Nómina (PDF)',
    description: 'Liquidación mensual en formato PDF',
    tone: 'amber',
  },
  {
    id: 'nom-04-xlsx',
    code: 'NOM-04',
    title: 'Nómina (Excel)',
    description: 'Liquidación mensual en hoja de cálculo',
    tone: 'amber',
  },
];

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function PayrollReportsScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const nominaTheme = theme === 'light' ? 'light' : 'dark';
  const [periodMode, setPeriodMode] = useState<NominaPeriodMode>('month');
  const payrollPeriod = useMemo(() => getCurrentPayrollPeriod(), []);
  const monthRange = useMemo(() => getMonthDateRange(payrollPeriod), [payrollPeriod]);
  const weekRange = useMemo(() => getCurrentWeekDateRange(), []);

  const payrollQuery = usePayrollReportQuery({ period: payrollPeriod });
  const monthAttendanceQuery = useAttendanceReportQuery(monthRange);
  const weekAttendanceQuery = useAttendanceReportQuery(weekRange, periodMode === 'week');

  const attendanceForKpi = monthAttendanceQuery.data;
  const attendanceForChart =
    periodMode === 'week' ? weekAttendanceQuery.data : monthAttendanceQuery.data;

  const metrics = useMemo(() => {
    if (!payrollQuery.data) return undefined;
    return mapPayrollKpiMetrics(payrollQuery.data, attendanceForKpi);
  }, [payrollQuery.data, attendanceForKpi]);

  const chart = useMemo(() => {
    if (!payrollQuery.data) return undefined;
    return mapPayrollChartData(payrollQuery.data, periodMode, attendanceForChart);
  }, [payrollQuery.data, periodMode, attendanceForChart]);

  const locationRows = useMemo(
    () => (payrollQuery.data ? mapLocationRows(payrollQuery.data) : undefined),
    [payrollQuery.data],
  );

  const closingBadgeLabel = payrollQuery.data
    ? formatClosingBadgeLabel(payrollQuery.data.period)
    : undefined;

  const legalAlertItems = useMemo(() => mapLegalAlertItems(attendanceForKpi), [attendanceForKpi]);

  const legalAlertCount = legalAlertItems.length;

  const isLoading =
    payrollQuery.isLoading ||
    monthAttendanceQuery.isLoading ||
    (periodMode === 'week' && weekAttendanceQuery.isLoading);

  const isError = payrollQuery.isError || monthAttendanceQuery.isError;

  const handleReportDownload = async (item: NominaReportDefinition): Promise<void> => {
    if (item.id === 'nom-04-pdf') {
      try {
        const blob = await exportPayrollReport(payrollPeriod, 'PDF');
        downloadBlob(blob, `payroll-report-${payrollPeriod}.pdf`);
        toast.success('Reporte de nómina PDF descargado');
      } catch (error) {
        const message =
          error instanceof PayrollApiError ? error.message : 'No se pudo descargar el reporte';
        toast.error(message);
      }
      return;
    }

    if (item.id === 'nom-04-xlsx') {
      try {
        const blob = await exportPayrollReport(payrollPeriod, 'XLSX');
        downloadBlob(blob, `payroll-report-${payrollPeriod}.xlsx`);
        toast.success('Reporte de nómina Excel descargado');
      } catch (error) {
        const message =
          error instanceof PayrollApiError ? error.message : 'No se pudo descargar el reporte';
        toast.error(message);
      }
      return;
    }

    toast.info('Exportación disponible próximamente para este reporte');
  };

  if (isLoading) {
    return (
      <div className={[styles.state, styles[`theme--${nominaTheme}`]].join(' ')}>
        <LoadingState message="Cargando reportes de nómina…" theme={nominaTheme} layout="compact" />
      </div>
    );
  }

  if (isError || !payrollQuery.data || !metrics || !chart || !locationRows) {
    return (
      <div className={[styles.state, styles[`theme--${nominaTheme}`]].join(' ')}>
        <p>No se pudieron cargar los reportes de nómina.</p>
        <button type="button" onClick={() => void payrollQuery.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <NominaDashboardPreview
      theme={nominaTheme}
      metrics={metrics}
      closingBadgeLabel={closingBadgeLabel}
      chartTitle={chart.title}
      chartData={chart.data}
      chartXDataKey={chart.xDataKey}
      chartSeries={chart.series}
      chartLegend={chart.legend}
      chartValueType={chart.valueType}
      period={periodMode}
      onPeriodChange={setPeriodMode}
      locationRows={locationRows}
      legalAlertsEmptyTitle={
        legalAlertCount === 0 ? 'Sin alertas activas' : `${legalAlertCount} alertas detectadas`
      }
      legalAlertsEmptyDescription={
        legalAlertCount === 0
          ? 'Todos los contratos y marcaciones cumplen con la normativa vigente.'
          : 'Hay empleados que superan los límites legales de horas extras en el periodo.'
      }
      legalAlertsItems={legalAlertItems}
      reports={REPORT_ITEMS}
      onReportDownload={(item) => void handleReportDownload(item)}
    />
  );
}
