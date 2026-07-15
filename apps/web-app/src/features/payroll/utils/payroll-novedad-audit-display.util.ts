const AUDIT_FIELD_LABELS: Record<string, string> = {
  startDate: 'Fecha inicio',
  endDate: 'Fecha fin',
  isPaid: 'Remunerada',
  notes: 'Notas',
};

function formatAuditDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split('-').map(Number);
  if (!year || !month || !day) return String(value);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatAuditBoolean(value: unknown): string {
  if (value === true) return 'Sí';
  if (value === false) return 'No';
  return '—';
}

function formatAuditNotes(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Sin notas';
  return String(value);
}

function formatAuditFieldValue(field: string, value: unknown): string {
  if (field === 'startDate' || field === 'endDate') return formatAuditDate(value);
  if (field === 'isPaid') return formatAuditBoolean(value);
  if (field === 'notes') return formatAuditNotes(value);
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function normalizeComparableValue(field: string, value: unknown): string {
  if (field === 'startDate' || field === 'endDate') {
    return value ? String(value).slice(0, 10) : '';
  }
  if (field === 'isPaid') {
    return value === true ? 'true' : value === false ? 'false' : '';
  }
  if (field === 'notes') {
    return value === null || value === undefined ? '' : String(value).trim();
  }
  return value === null || value === undefined ? '' : String(value);
}

export interface NovedadAuditChangeLine {
  field: string;
  label: string;
  from: string;
  to: string;
}

export function describeNovedadAuditChanges(
  previousValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
): NovedadAuditChangeLine[] {
  const fields = new Set([...Object.keys(previousValue), ...Object.keys(newValue)]);

  return [...fields]
    .filter((field) => field in AUDIT_FIELD_LABELS)
    .map((field) => {
      const previous = previousValue[field];
      const next = newValue[field];
      const changed =
        normalizeComparableValue(field, previous) !== normalizeComparableValue(field, next);
      if (!changed) return null;

      return {
        field,
        label: AUDIT_FIELD_LABELS[field] ?? field,
        from: formatAuditFieldValue(field, previous),
        to: formatAuditFieldValue(field, next),
      };
    })
    .filter((line): line is NovedadAuditChangeLine => line !== null);
}

export function formatNovedadAuditTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
