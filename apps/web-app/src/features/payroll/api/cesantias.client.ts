import { payrollFetch, payrollFetchBlobWithHeaders } from './payroll.client';
import type {
  CesantiasAlertSummary,
  CesantiasCalculateResult,
  CesantiasExportAvailability,
  CesantiasExportChannel,
  CesantiasExportResult,
  CesantiasListResponse,
  ListCesantiasFilters,
} from '../types/cesantias.types';

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export function listCesantias(filters: ListCesantiasFilters = {}): Promise<CesantiasListResponse> {
  const query = toQueryString({
    year: filters.year,
    cesantiasStatus: filters.cesantiasStatus,
    interestStatus: filters.interestStatus,
    fundChannelSnapshot: filters.fundChannelSnapshot,
    fundNameSnapshot: filters.fundNameSnapshot,
    limit: filters.limit,
    offset: filters.offset,
  });
  return payrollFetch<CesantiasListResponse>(`/cesantias${query}`);
}

export function calculateCesantias(year: number): Promise<CesantiasCalculateResult> {
  return payrollFetch<CesantiasCalculateResult>('/cesantias/calculate', {
    method: 'POST',
    body: JSON.stringify({ year }),
  });
}

export function getCesantiasAlertSummary(): Promise<CesantiasAlertSummary> {
  return payrollFetch<CesantiasAlertSummary>('/cesantias/alert-summary');
}

export function getCesantiasExportAvailability(year: number): Promise<CesantiasExportAvailability> {
  return payrollFetch<CesantiasExportAvailability>(
    `/cesantias/export-availability${toQueryString({ year })}`,
  );
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

export async function exportCesantias(
  channel: CesantiasExportChannel,
  year: number,
): Promise<CesantiasExportResult> {
  const { blob, headers } = await payrollFetchBlobWithHeaders(`/cesantias/export/${channel}`, {
    method: 'POST',
    body: JSON.stringify({ year }),
  });
  const filename = parseFilenameFromContentDisposition(headers.get('Content-Disposition'));
  const skippedCount = Number(headers.get('X-Cesantias-Export-Skipped-Count') ?? '0');
  return { blob, filename, skippedCount: Number.isFinite(skippedCount) ? skippedCount : 0 };
}
