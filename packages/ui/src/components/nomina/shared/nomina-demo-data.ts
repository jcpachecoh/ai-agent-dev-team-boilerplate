import type { BarChartSeries } from '../../charts/bar-chart/BarChart';
import type {
  NominaChartLegendItem,
  NominaKpiMetric,
  NominaLocationBreakdownRow,
  NominaReportDefinition,
} from './nomina-types';

export const NOMINA_DEMO_KPI_METRICS: NominaKpiMetric[] = [
  {
    id: 'payroll',
    title: 'Nómina estimada mes',
    value: '$ 34.660.000',
    description: '16 empleados activos',
    tone: 'accent',
  },
  {
    id: 'overtime',
    title: 'Total horas extras',
    value: '1h 45m',
    description: 'Acumulado del día',
    tone: 'amber',
  },
  {
    id: 'employees',
    title: 'Empleados activos',
    value: '16',
    description: 'de 18 totales',
    tone: 'teal',
  },
  {
    id: 'alerts',
    title: 'Alertas legales',
    value: '0',
    description: 'Sin alertas activas',
    tone: 'muted',
  },
];

export const NOMINA_DEMO_CHART_DATA: Array<Record<string, string | number>> = [
  { week: 'S1', chapinero: 8200000, zonaRosa: 6400000, elPoblado: 9100000, unicentro: 5800000 },
  { week: 'S2', chapinero: 8600000, zonaRosa: 6900000, elPoblado: 8800000, unicentro: 6100000 },
  { week: 'S3', chapinero: 9100000, zonaRosa: 7200000, elPoblado: 9300000, unicentro: 6400000 },
  { week: 'S4', chapinero: 8800000, zonaRosa: 7100000, elPoblado: 9000000, unicentro: 6200000 },
];

export const NOMINA_DEMO_CHART_SERIES: BarChartSeries[] = [
  { dataKey: 'chapinero', name: 'Chapinero', colorIndex: 1 },
  { dataKey: 'zonaRosa', name: 'Zona Rosa', colorIndex: 4 },
  { dataKey: 'elPoblado', name: 'El Poblado', colorIndex: 3 },
  { dataKey: 'unicentro', name: 'Unicentro', colorIndex: 5 },
];

export const NOMINA_DEMO_CHART_LEGEND: NominaChartLegendItem[] = [
  { id: 'chapinero', label: 'Chapinero', tone: 'accent' },
  { id: 'zonaRosa', label: 'Zona Rosa', tone: 'purple' },
  { id: 'elPoblado', label: 'El Poblado', tone: 'teal' },
  { id: 'unicentro', label: 'Unicentro', tone: 'amber' },
];

export const NOMINA_DEMO_LOCATION_ROWS: NominaLocationBreakdownRow[] = [
  {
    id: 'chapinero',
    name: 'Chapinero',
    city: 'Bogotá',
    amountLabel: '$ 12.400.000',
    employeeCountLabel: '5 activos',
    shareLabel: '35.8%',
    progressPercent: 36,
    tone: 'accent',
  },
  {
    id: 'zona-rosa',
    name: 'Zona Rosa',
    city: 'Bogotá',
    amountLabel: '$ 9.200.000',
    employeeCountLabel: '4 activos',
    shareLabel: '26.5%',
    progressPercent: 27,
    tone: 'purple',
  },
  {
    id: 'el-poblado',
    name: 'El Poblado',
    city: 'Medellín',
    amountLabel: '$ 8.060.000',
    employeeCountLabel: '4 activos',
    shareLabel: '23.3%',
    progressPercent: 23,
    tone: 'teal',
  },
  {
    id: 'unicentro',
    name: 'Unicentro',
    city: 'Bogotá',
    amountLabel: '$ 5.000.000',
    employeeCountLabel: '3 activos',
    shareLabel: '14.4%',
    progressPercent: 14,
    tone: 'amber',
  },
];

export const NOMINA_DEMO_REPORTS: NominaReportDefinition[] = [
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
    id: 'nom-04',
    code: 'NOM-04',
    title: 'Nómina',
    description: 'Liquidación estimada por sede',
    tone: 'amber',
  },
];
