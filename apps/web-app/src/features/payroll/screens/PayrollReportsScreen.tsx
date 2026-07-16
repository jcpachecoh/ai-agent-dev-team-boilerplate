import {
  LoadingState,
  NominaDashboardPreview,
  RecetaFilterSelect,
  type NominaReportDefinition,
  toast,
} from '@restopsiq/ui';
import { Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useLocations } from '@/features/sedes/hooks/useLocations';
import { useTheme } from '@/providers/ThemeProvider';

import styles from './PayrollReportsScreen.module.scss';
import {
  exportAttendanceReport,
  exportEmployeeList,
  exportPayrollReport,
  PayrollApiError,
} from '../api/payroll.client';
import { PilaPeriodPanel } from '../components/PilaPeriodPanel';
import { SenaQuotaPanel } from '../components/SenaQuotaPanel';
import { useAttendanceReportQuery, usePayrollReportQuery } from '../hooks/usePayrollReportQueries';
import { downloadExportBlob } from '../utils/download-export-blob';
import {
  formatDateRangeBadgeLabel,
  getCurrentPayrollPeriod,
  getMonthDateRange,
  mapLocationRows,
  mapLegalAlertItems,
  mapPayrollChartData,
  mapPayrollKpiMetrics,
} from '../utils/mapPayrollReportToNomina';

const REPORT_ITEMS: NominaReportDefinition[] = [
  {
    id: 'nom-01',
    code: 'NOM-01',
    title: 'Empleados (PDF)',
    description: 'Listado completo con datos contractuales',
    tone: 'accent',
  },
  {
    id: 'nom-01-xlsx',
    code: 'NOM-01',
    title: 'Empleados (Excel)',
    description: 'Listado completo en hoja de cálculo',
    tone: 'accent',
  },
  {
    id: 'nom-02',
    code: 'NOM-02',
    title: 'Contratos (PDF)',
    description: 'Vigencia, tipo y condiciones laborales',
    tone: 'purple',
  },
  {
    id: 'nom-02-xlsx',
    code: 'NOM-02',
    title: 'Contratos (Excel)',
    description: 'Vigencia y condiciones en hoja de cálculo',
    tone: 'purple',
  },
  {
    id: 'nom-03',
    code: 'NOM-03',
    title: 'Asistencia (PDF)',
    description: 'Marcaciones y horas extras del periodo',
    tone: 'teal',
  },
  {
    id: 'nom-03-xlsx',
    code: 'NOM-03',
    title: 'Asistencia (Excel)',
    description: 'Marcaciones del periodo en hoja de cálculo',
    tone: 'teal',
  },
  {
    id: 'nom-04-pdf',
    code: 'NOM-04',
    title: 'Nómina (PDF)',
    description: 'Liquidación del periodo en formato PDF',
    tone: 'amber',
  },
  {
    id: 'nom-04-xlsx',
    code: 'NOM-04',
    title: 'Nómina (Excel)',
    description: 'Liquidación del periodo en hoja de cálculo',
    tone: 'amber',
  },
];

function getDefaultDateRange(): { from: string; to: string } {
  return getMonthDateRange(getCurrentPayrollPeriod());
}

export function PayrollReportsScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const nominaTheme = theme === 'light' ? 'light' : 'dark';
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [locationId, setLocationId] = useState('');
  const locationsQuery = useLocations();

  const dateRange = useMemo(() => ({ from: dateFrom, to: dateTo }), [dateFrom, dateTo]);

  const payrollPeriod = useMemo(() => dateFrom.slice(0, 7), [dateFrom]);

  const reportQuery = useMemo(
    () => ({ period: payrollPeriod, locationId: locationId || undefined }),
    [payrollPeriod, locationId],
  );

  const attendanceQueryFilters = useMemo(
    () => ({
      from: dateFrom,
      to: dateTo,
      locationId: locationId || undefined,
    }),
    [dateFrom, dateTo, locationId],
  );

  const payrollQuery = usePayrollReportQuery(reportQuery);
  const attendanceQuery = useAttendanceReportQuery(attendanceQueryFilters);

  const locationOptions = useMemo(
    () =>
      (locationsQuery.data ?? [])
        .filter((location) => location.isActive !== false)
        .map((location) => ({ value: location.id, label: location.name })),
    [locationsQuery.data],
  );

  const metrics = useMemo(() => {
    if (!payrollQuery.data) {
      return undefined;
    }
    return mapPayrollKpiMetrics(payrollQuery.data, attendanceQuery.data, dateRange);
  }, [payrollQuery.data, attendanceQuery.data, dateRange]);

  const chart = useMemo(() => {
    if (!payrollQuery.data) {
      return undefined;
    }
    return mapPayrollChartData(payrollQuery.data, dateRange, attendanceQuery.data);
  }, [payrollQuery.data, dateRange, attendanceQuery.data]);

  const locationRows = useMemo(
    () => (payrollQuery.data ? mapLocationRows(payrollQuery.data) : undefined),
    [payrollQuery.data],
  );

  const closingBadgeLabel = formatDateRangeBadgeLabel(dateTo);

  const legalAlertItems = useMemo(
    () => mapLegalAlertItems(attendanceQuery.data),
    [attendanceQuery.data],
  );

  const legalAlertCount = legalAlertItems.length;

  const isLoading = payrollQuery.isLoading || attendanceQuery.isLoading;

  const isError = payrollQuery.isError || attendanceQuery.isError;

  const handleDateFromChange = (value: string): void => {
    setDateFrom(value);
    if (value > dateTo) {
      setDateTo(value);
    }
  };

  const handleDateToChange = (value: string): void => {
    setDateTo(value);
    if (value < dateFrom) {
      setDateFrom(value);
    }
  };

  const handleReportDownload = async (item: NominaReportDefinition): Promise<void> => {
    try {
      if (item.id === 'nom-01' || item.id === 'nom-01-xlsx') {
        const format = item.id.endsWith('xlsx') ? 'XLSX' : 'PDF';
        const blob = await exportEmployeeList(
          { locationId: locationId || undefined, isActive: true },
          format,
          'EMPLOYEES',
        );
        downloadExportBlob(
          blob,
          `empleados-${dateFrom}-${dateTo}.${format === 'PDF' ? 'pdf' : 'xlsx'}`,
        );
        toast.success(`Reporte de empleados descargado`);
        return;
      }

      if (item.id === 'nom-02' || item.id === 'nom-02-xlsx') {
        const format = item.id.endsWith('xlsx') ? 'XLSX' : 'PDF';
        const blob = await exportEmployeeList(
          { locationId: locationId || undefined, isActive: true },
          format,
          'CONTRACTS',
        );
        downloadExportBlob(
          blob,
          `contratos-${dateFrom}-${dateTo}.${format === 'PDF' ? 'pdf' : 'xlsx'}`,
        );
        toast.success('Reporte de contratos descargado');
        return;
      }

      if (item.id === 'nom-03' || item.id === 'nom-03-xlsx') {
        const format = item.id.endsWith('xlsx') ? 'XLSX' : 'PDF';
        const blob = await exportAttendanceReport(attendanceQueryFilters, format);
        downloadExportBlob(
          blob,
          `asistencia-${dateFrom}-${dateTo}.${format === 'PDF' ? 'pdf' : 'xlsx'}`,
        );
        toast.success('Reporte de asistencia descargado');
        return;
      }

      if (item.id === 'nom-04-pdf') {
        const blob = await exportPayrollReport(reportQuery, 'PDF');
        downloadExportBlob(blob, `payroll-report-${dateFrom}-${dateTo}.pdf`);
        toast.success('Reporte de nómina PDF descargado');
        return;
      }

      if (item.id === 'nom-04-xlsx') {
        const blob = await exportPayrollReport(reportQuery, 'XLSX');
        downloadExportBlob(blob, `payroll-report-${dateFrom}-${dateTo}.xlsx`);
        toast.success('Reporte de nómina Excel descargado');
      }
    } catch (error) {
      const message =
        error instanceof PayrollApiError ? error.message : 'No se pudo descargar el reporte';
      toast.error(message);
    }
  };

  const filtersBar = (
    <div className={[styles.filtersBar, styles[`theme--${nominaTheme}`]].join(' ')}>
      <div className={styles.filterField}>
        <span className={styles.filterLabel}>Desde</span>
        <div className={styles.dateInputWrap}>
          <input
            className={styles.filterInput}
            type="date"
            value={dateFrom}
            onChange={(event) => handleDateFromChange(event.target.value)}
          />
          <Calendar className={styles.calendarIcon} aria-hidden strokeWidth={1.75} />
        </div>
      </div>
      <div className={styles.filterField}>
        <span className={styles.filterLabel}>Hasta</span>
        <div className={styles.dateInputWrap}>
          <input
            className={styles.filterInput}
            type="date"
            value={dateTo}
            onChange={(event) => handleDateToChange(event.target.value)}
          />
          <Calendar className={styles.calendarIcon} aria-hidden strokeWidth={1.75} />
        </div>
      </div>
      <div className={styles.filterField}>
        <span className={styles.filterLabel}>Sede</span>
        <RecetaFilterSelect
          theme={nominaTheme}
          size="md"
          value={locationId}
          options={[{ value: '', label: 'Todas las sedes' }, ...locationOptions]}
          onChange={setLocationId}
        />
      </div>
    </div>
  );

  const hasPayrollDashboard =
    !isLoading &&
    !isError &&
    Boolean(payrollQuery.data) &&
    Boolean(metrics) &&
    Boolean(chart) &&
    Boolean(locationRows);

  return (
    <div className={styles.reportsLayout}>
      {hasPayrollDashboard && metrics && chart && locationRows ? (
        <NominaDashboardPreview
          theme={nominaTheme}
          className={styles.dashboard}
          showPeriodToggle={false}
          metrics={metrics}
          closingBadgeLabel={closingBadgeLabel}
          chartTitle={chart.title}
          chartData={chart.data}
          chartXDataKey={chart.xDataKey}
          chartSeries={chart.series}
          chartLegend={chart.legend}
          chartValueType={chart.valueType}
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
          filtersBar={filtersBar}
        />
      ) : (
        <>
          {filtersBar}
          <div className={[styles.state, styles[`theme--${nominaTheme}`]].join(' ')}>
            {isLoading ? (
              <LoadingState
                message="Cargando reportes de nómina…"
                theme={nominaTheme}
                layout="compact"
              />
            ) : (
              <>
                <p>No se pudieron cargar los reportes de nómina.</p>
                <button type="button" onClick={() => void payrollQuery.refetch()}>
                  Reintentar
                </button>
              </>
            )}
          </div>
        </>
      )}
      {/* PILA y SENA: consulta propia; no dependen del ?xito del reporte payroll. */}
      <PilaPeriodPanel period={payrollPeriod} />
      <SenaQuotaPanel period={payrollPeriod} />
    </div>
  );
}
