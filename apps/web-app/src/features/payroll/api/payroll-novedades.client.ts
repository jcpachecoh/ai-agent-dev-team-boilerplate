import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';

import type {
  ListMyPayrollNovedadesFilters,
  ListPayrollNovedadesFilters,
  NovedadTypeConfig,
  PayrollNovedadRecord,
  PayrollNovedadSummary,
  RejectPayrollNovedadInput,
  SubmitPayrollNovedadInput,
  SubmitPayrollNovedadResult,
} from '../types/payroll-novedades.types';
import { buildPayrollUrl } from './payroll.client';

const ALLOWED_SUPPORT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_SUPPORT_BYTES = 10 * 1024 * 1024;

export class PayrollNovedadesApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'PayrollNovedadesApiError';
  }
}

function authHeaders(contentType?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'x-tenant-id': getTenantId(),
    'apollo-require-preflight': '1',
  };
  const token = getGraphqlAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (contentType) headers['Content-Type'] = contentType;
  return headers;
}

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join('. ');
    if (typeof payload.message === 'string') return payload.message;
  } catch {
    // ignore
  }
  return fallback;
}

export function validatePayrollNovedadSupportFile(file: File): string | null {
  if (!ALLOWED_SUPPORT_TYPES.includes(file.type)) {
    return 'Solo se permiten archivos PDF, JPG o PNG';
  }
  if (file.size > MAX_SUPPORT_BYTES) {
    return `El archivo no puede superar ${MAX_SUPPORT_BYTES / 1024 / 1024} MB`;
  }
  return null;
}

export async function listPayrollNovedades(
  filters: ListPayrollNovedadesFilters = {},
): Promise<PayrollNovedadSummary[]> {
  const response = await fetch(
    buildPayrollUrl(
      `/payroll-novedades${toQueryString(filters as Record<string, string | number | boolean | undefined>)}`,
    ),
    { headers: authHeaders() },
  );
  if (!response.ok) {
    throw new PayrollNovedadesApiError(
      await parseErrorMessage(response, 'No se pudieron cargar las novedades'),
      response.status,
    );
  }
  return (await response.json()) as PayrollNovedadSummary[];
}

export async function listMyPayrollNovedades(
  filters: ListMyPayrollNovedadesFilters = {},
): Promise<PayrollNovedadSummary[]> {
  const response = await fetch(
    buildPayrollUrl(
      `/payroll-novedades/me${toQueryString(filters as Record<string, string | number | boolean | undefined>)}`,
    ),
    { headers: authHeaders() },
  );
  if (!response.ok) {
    throw new PayrollNovedadesApiError(
      await parseErrorMessage(response, 'No se pudieron cargar sus novedades'),
      response.status,
    );
  }
  return (await response.json()) as PayrollNovedadSummary[];
}

export async function listEmployeeNovedadTypeConfigs(): Promise<NovedadTypeConfig[]> {
  const response = await fetch(buildPayrollUrl('/payroll-novedades/me/type-config'), {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new PayrollNovedadesApiError(
      await parseErrorMessage(response, 'No se pudo cargar la configuración'),
      response.status,
    );
  }
  return (await response.json()) as NovedadTypeConfig[];
}

export async function getPayrollNovedad(id: string): Promise<PayrollNovedadRecord> {
  const response = await fetch(buildPayrollUrl(`/payroll-novedades/${id}`), {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new PayrollNovedadesApiError(
      await parseErrorMessage(response, 'No se pudo cargar la novedad'),
      response.status,
    );
  }
  return (await response.json()) as PayrollNovedadRecord;
}

export async function submitPayrollNovedad(
  input: SubmitPayrollNovedadInput,
): Promise<SubmitPayrollNovedadResult> {
  const response = await fetch(buildPayrollUrl('/payroll-novedades'), {
    method: 'POST',
    headers: authHeaders('application/json'),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new PayrollNovedadesApiError(
      await parseErrorMessage(response, 'No se pudo registrar la novedad'),
      response.status,
    );
  }
  return (await response.json()) as SubmitPayrollNovedadResult;
}

export async function approvePayrollNovedadSupervisor(id: string): Promise<PayrollNovedadRecord> {
  const response = await fetch(buildPayrollUrl(`/payroll-novedades/${id}/approve/supervisor`), {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new PayrollNovedadesApiError(
      await parseErrorMessage(response, 'No se pudo aprobar la novedad'),
      response.status,
    );
  }
  return (await response.json()) as PayrollNovedadRecord;
}

export async function rejectPayrollNovedadSupervisor(
  id: string,
  input: RejectPayrollNovedadInput,
): Promise<PayrollNovedadRecord> {
  const response = await fetch(buildPayrollUrl(`/payroll-novedades/${id}/reject/supervisor`), {
    method: 'POST',
    headers: authHeaders('application/json'),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new PayrollNovedadesApiError(
      await parseErrorMessage(response, 'No se pudo rechazar la novedad'),
      response.status,
    );
  }
  return (await response.json()) as PayrollNovedadRecord;
}

export async function approvePayrollNovedadRrhh(id: string): Promise<PayrollNovedadRecord> {
  const response = await fetch(buildPayrollUrl(`/payroll-novedades/${id}/approve/rrhh`), {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new PayrollNovedadesApiError(
      await parseErrorMessage(response, 'No se pudo aprobar la novedad'),
      response.status,
    );
  }
  return (await response.json()) as PayrollNovedadRecord;
}

export async function rejectPayrollNovedadRrhh(
  id: string,
  input: RejectPayrollNovedadInput,
): Promise<PayrollNovedadRecord> {
  const response = await fetch(buildPayrollUrl(`/payroll-novedades/${id}/reject/rrhh`), {
    method: 'POST',
    headers: authHeaders('application/json'),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new PayrollNovedadesApiError(
      await parseErrorMessage(response, 'No se pudo rechazar la novedad'),
      response.status,
    );
  }
  return (await response.json()) as PayrollNovedadRecord;
}

export async function uploadPayrollNovedadSupport(
  id: string,
  file: File,
): Promise<PayrollNovedadRecord> {
  const validationError = validatePayrollNovedadSupportFile(file);
  if (validationError) {
    throw new PayrollNovedadesApiError(validationError, 400);
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(buildPayrollUrl(`/payroll-novedades/${id}/support`), {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!response.ok) {
    throw new PayrollNovedadesApiError(
      await parseErrorMessage(response, 'No se pudo adjuntar el soporte'),
      response.status,
    );
  }
  return (await response.json()) as PayrollNovedadRecord;
}

export async function fetchPayrollNovedadSupportUrl(id: string): Promise<string> {
  const response = await fetch(buildPayrollUrl(`/payroll-novedades/${id}/support/download`), {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new PayrollNovedadesApiError(
      await parseErrorMessage(response, 'No se pudo obtener el soporte'),
      response.status,
    );
  }
  const payload = (await response.json()) as { url: string };
  return payload.url;
}

export async function uploadPayrollNovedadSupportDraft(
  employeeId: string,
  file: File,
): Promise<{ id: string }> {
  const validationError = validatePayrollNovedadSupportFile(file);
  if (validationError) {
    throw new PayrollNovedadesApiError(validationError, 400);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('domain', 'PAYROLL');
  formData.append('entityType', 'PayrollNovedad');
  formData.append('entityId', employeeId);
  formData.append('visibility', 'PRIVATE');

  const response = await fetch(buildPayrollUrl('/storage/upload'), {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new PayrollNovedadesApiError(
      await parseErrorMessage(response, 'No se pudo subir el soporte'),
      response.status,
    );
  }

  return (await response.json()) as { id: string };
}

export async function listNovedadTypeConfigs(): Promise<NovedadTypeConfig[]> {
  const response = await fetch(buildPayrollUrl('/payroll-novedades/type-config'), {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new PayrollNovedadesApiError(
      await parseErrorMessage(response, 'No se pudo cargar la configuración'),
      response.status,
    );
  }
  return (await response.json()) as NovedadTypeConfig[];
}
