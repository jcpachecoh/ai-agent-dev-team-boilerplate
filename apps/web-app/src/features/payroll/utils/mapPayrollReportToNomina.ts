import type {
  NominaChartLegendItem,
  NominaKpiMetric,
  NominaLegalAlertItem,
  NominaLocationBreakdownRow,
  NominaLocationTone,
  NominaPeriodMode,
} from '@restopsiq/ui';

interface NominaBarChartSeries {
  dataKey: string;
  name: string;
  colorIndex?: number;
}

import type {
  AttendanceReportResponse,
  PayrollReportResponse,
} from '../types/payroll-reports.types';

const LOCATION_TONES: NominaLocationTone[] = ['accent', 'purple', 'teal', 'amber'];
const CHART_COLOR_INDEXES = [1, 4, 3, 5];

const MONTH_LABELS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function splitLocationName(locationName: string): { name: string; city: string } {
  const [name, city] = locationName.split(' - ');
  return {
    name: name?.trim() ?? locationName,
    city: city?.trim() ?? '',
  };
}

export function formatPayrollCurrency(amount: number): string {
  return `$ ${Math.round(amount).toLocaleString('es-CO')}`;
}

export function formatOvertimeMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getCurrentPayrollPeriod(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
  })
    .format(new Date())
    .slice(0, 7);
}

export function getMonthDateRange(period: string): { from: string; to: string } {
  const [year, month] = period.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${period}-01`,
    to: `${period}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function getCurrentWeekDateRange(): { from: string; to: string } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '1');
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '1');
  const bogotaDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = bogotaDate.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(bogotaDate);
  monday.setUTCDate(bogotaDate.getUTCDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const toIso = (date: Date): string =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;

  return { from: toIso(monday), to: toIso(sunday) };
}

export function formatClosingBadgeLabel(period: PayrollReportResponse['period']): string {
  const lastDay = new Date(period.year, period.month, 0).getDate();
  const monthLabel = MONTH_LABELS[period.month - 1] ?? 'mes';
  return `Cierre: ${lastDay} ${monthLabel}`;
}

function getLocationTone(index: number): NominaLocationTone {
  return LOCATION_TONES[index % LOCATION_TONES.length] ?? 'accent';
}

export function mapLocationRows(report: PayrollReportResponse): NominaLocationBreakdownRow[] {
  const totalCost = report.tenantTotals.totalPayrollCost;

  return report.locationTotals.map((location, index) => {
    const { name, city } = splitLocationName(location.locationName);
    const share = totalCost > 0 ? (location.totalPayrollCost / totalCost) * 100 : 0;

    return {
      id: location.locationId,
      name,
      city,
      amountLabel: formatPayrollCurrency(location.totalPayrollCost),
      employeeCountLabel: `${location.employeeCount} activos`,
      shareLabel: `${share.toFixed(1)}%`,
      progressPercent: Math.min(100, Math.round(share)),
      tone: getLocationTone(index),
    };
  });
}

export function mapPayrollKpiMetrics(
  report: PayrollReportResponse,
  attendance: AttendanceReportResponse | undefined,
): NominaKpiMetric[] {
  const overtimeMinutes =
    attendance?.employees.reduce((sum, employee) => sum + employee.overtimeMinutes, 0) ?? 0;
  const legalAlerts =
    attendance?.employees.filter((employee) => employee.exceededLegalOvertimeLimit).length ?? 0;

  return [
    {
      id: 'payroll',
      title: 'Nómina estimada mes',
      value: formatPayrollCurrency(report.tenantTotals.totalPayrollCost),
      description: `${report.tenantTotals.employeeCount} empleados en liquidación`,
      tone: 'accent',
    },
    {
      id: 'overtime',
      title: 'Total horas extras',
      value: formatOvertimeMinutes(overtimeMinutes),
      description: 'Acumulado del periodo',
      tone: 'amber',
    },
    {
      id: 'alerts',
      title: 'Alertas legales',
      value: String(legalAlerts),
      description:
        legalAlerts === 0
          ? 'Sin empleados sobre el límite'
          : `${legalAlerts} empleado${legalAlerts === 1 ? '' : 's'} con exceso de extras`,
      tone: legalAlerts === 0 ? 'muted' : 'amber',
    },
  ];
}

export function mapLegalAlertItems(
  attendance: AttendanceReportResponse | undefined,
): NominaLegalAlertItem[] {
  return (attendance?.employees ?? [])
    .filter((employee) => employee.exceededLegalOvertimeLimit)
    .map((employee) => {
      const { name: locationName } = splitLocationName(employee.locationName);
      return {
        id: employee.employeeId,
        title: employee.employeeName,
        subtitle: `${locationName} · ${formatOvertimeMinutes(employee.overtimeMinutes)} extras`,
      };
    });
}

function aggregateMinutesByLocation(
  attendance: AttendanceReportResponse | undefined,
  field: 'totalWorkedMinutes' | 'overtimeMinutes',
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const employee of attendance?.employees ?? []) {
    totals.set(employee.locationId, (totals.get(employee.locationId) ?? 0) + employee[field]);
  }
  return totals;
}

function minutesToChartHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

function buildLocationChartMeta(report: PayrollReportResponse): {
  series: NominaBarChartSeries[];
  legend: NominaChartLegendItem[];
} {
  const series = report.locationTotals.map((location, index) => {
    const { name } = splitLocationName(location.locationName);
    return {
      dataKey: location.locationId,
      name,
      colorIndex: CHART_COLOR_INDEXES[index % CHART_COLOR_INDEXES.length],
    };
  });

  const legend = report.locationTotals.map((location, index) => {
    const { name } = splitLocationName(location.locationName);
    return {
      id: location.locationId,
      label: name,
      tone: getLocationTone(index),
    };
  });

  return { series, legend };
}

export function mapPayrollChartData(
  report: PayrollReportResponse,
  periodMode: NominaPeriodMode,
  attendance?: AttendanceReportResponse,
): {
  title: string;
  xDataKey: string;
  data: Array<Record<string, string | number>>;
  series: NominaBarChartSeries[];
  legend: NominaChartLegendItem[];
  valueType: 'currency' | 'number';
} {
  const { series, legend } = buildLocationChartMeta(report);
  const workedByLocation = aggregateMinutesByLocation(attendance, 'totalWorkedMinutes');

  if (periodMode === 'week') {
    const dataPoint: Record<string, string | number> = { week: 'Semana actual' };
    for (const location of report.locationTotals) {
      dataPoint[location.locationId] = minutesToChartHours(
        workedByLocation.get(location.locationId) ?? 0,
      );
    }

    return {
      title: 'Asistencia por sede (semana)',
      xDataKey: 'week',
      data: [dataPoint],
      series,
      legend,
      valueType: 'number',
    };
  }

  const dataPoint: Record<string, string | number> = { period: 'Mes actual' };
  for (const location of report.locationTotals) {
    dataPoint[location.locationId] = minutesToChartHours(
      workedByLocation.get(location.locationId) ?? 0,
    );
  }

  return {
    title: 'Asistencia por sede (mes)',
    xDataKey: 'period',
    data: [dataPoint],
    series,
    legend,
    valueType: 'number',
  };
}
