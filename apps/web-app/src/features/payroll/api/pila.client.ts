import { payrollFetch, payrollFetchBlobWithHeaders } from './payroll.client';
import type {
  MarkPilaExportPaidInput,
  PilaDeadlineResponse,
  PilaDownloadResult,
  PilaExportFormat,
  PilaPeriodExport,
  PilaPeriodExportStatus,
  PilaValidationResponse,
  VoidPilaExportInput,
} from '../types/pila.types';

function toQueryString(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    search.set(key, value);
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const match = header.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? null;
}

export function validatePilaPeriod(period: string): Promise<PilaValidationResponse> {
  return payrollFetch<PilaValidationResponse>(`/reports/pila/${period}/validation`);
}

export function getPilaDeadline(period: string): Promise<PilaDeadlineResponse> {
  return payrollFetch<PilaDeadlineResponse>(`/reports/pila/${period}/deadline`);
}

export function generatePilaExport(
  period: string,
  format: PilaExportFormat = 'TXT',
): Promise<PilaPeriodExport> {
  return payrollFetch<PilaPeriodExport>(`/reports/pila/${period}/generate`, {
    method: 'POST',
    body: JSON.stringify({ format }),
  });
}

export function listPilaExports(
  filters: {
    period?: string;
    status?: PilaPeriodExportStatus;
    format?: PilaExportFormat;
  } = {},
): Promise<PilaPeriodExport[]> {
  return payrollFetch<PilaPeriodExport[]>(
    `/reports/pila${toQueryString({
      period: filters.period,
      status: filters.status,
      format: filters.format,
    })}`,
  );
}

export async function downloadPilaExport(exportId: string): Promise<PilaDownloadResult> {
  const { blob, headers } = await payrollFetchBlobWithHeaders(
    `/reports/pila/exports/${exportId}/download`,
  );
  const filename =
    parseFilenameFromContentDisposition(headers.get('Content-Disposition')) ??
    `pila-export-${exportId}.txt`;
  return { blob, filename };
}

export function markPilaExportPaid(
  exportId: string,
  input: MarkPilaExportPaidInput,
): Promise<PilaPeriodExport> {
  return payrollFetch<PilaPeriodExport>(`/reports/pila/exports/${exportId}/paid`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function voidPilaExport(
  exportId: string,
  input: VoidPilaExportInput,
): Promise<PilaPeriodExport> {
  return payrollFetch<PilaPeriodExport>(`/reports/pila/exports/${exportId}/void`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
