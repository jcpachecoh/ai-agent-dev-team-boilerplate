export type NominaTheme = 'light' | 'dark';

export type NominaSize = 'sm' | 'md' | 'xl';

export type NominaKpiTone = 'accent' | 'amber' | 'teal' | 'muted';

export type NominaLocationTone = 'accent' | 'purple' | 'teal' | 'amber';

export type NominaPeriodMode = 'week' | 'month';

export type NominaReportTone = 'accent' | 'purple' | 'teal' | 'amber';

export interface NominaChartLegendItem {
  id: string;
  label: string;
  tone: NominaLocationTone;
}

export interface NominaKpiMetric {
  id: string;
  title: string;
  value: string;
  description?: string;
  tone?: NominaKpiTone;
}

export interface NominaLocationBreakdownRow {
  id: string;
  name: string;
  city: string;
  amountLabel: string;
  employeeCountLabel: string;
  shareLabel: string;
  progressPercent: number;
  tone: NominaLocationTone;
}

export interface NominaReportDefinition {
  id: string;
  code: string;
  title: string;
  description: string;
  tone: NominaReportTone;
}

export interface NominaLegalAlertItem {
  id: string;
  title: string;
  subtitle?: string;
}

export interface NominaDashboardMetrics {
  estimatedPayroll: string;
  estimatedPayrollHint: string;
  overtimeHours: string;
  overtimeHint: string;
  activeEmployees: string;
  activeEmployeesHint: string;
  legalAlerts: string;
  legalAlertsHint: string;
}
