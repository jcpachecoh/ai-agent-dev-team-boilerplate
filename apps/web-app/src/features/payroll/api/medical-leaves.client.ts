import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';

import type {
  CreateMedicalLeaveInput,
  ListMedicalLeavesFilters,
  MedicalLeaveDetail,
  MedicalLeaveRecord,
  MedicalLeaveSummary,
  UpdateMedicalLeaveStatusInput,
} from '../types/medical-leaves.types';
import { buildPayrollUrl } from './payroll.client';

const ALLOWED_SUPPORT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_SUPPORT_BYTES = 10 * 1024 * 1024;

export class MedicalLeavesApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'MedicalLeavesApiError';
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

function toQueryString(params: Record<string, string | number | undefined>): string {
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

export function validateMedicalLeaveSupportFile(file: File): string | null {
  if (!ALLOWED_SUPPORT_TYPES.includes(file.type)) {
    return 'Solo se permiten archivos PDF, JPG o PNG';
  }
  if (file.size > MAX_SUPPORT_BYTES) {
    return `El archivo no puede superar ${MAX_SUPPORT_BYTES / 1024 / 1024} MB`;
  }
  return null;
}

export async function listMedicalLeaves(
  filters: ListMedicalLeavesFilters = {},
): Promise<MedicalLeaveSummary[]> {
  const response = await fetch(
    buildPayrollUrl(
      `/medical-leaves${toQueryString(filters as Record<string, string | number | undefined>)}`,
    ),
    { headers: authHeaders() },
  );
  if (!response.ok) {
    throw new MedicalLeavesApiError(
      await parseErrorMessage(response, 'No se pudieron cargar las incapacidades'),
      response.status,
    );
  }
  return (await response.json()) as MedicalLeaveSummary[];
}

export async function getMedicalLeaveById(id: string): Promise<MedicalLeaveDetail> {
  const response = await fetch(buildPayrollUrl(`/medical-leaves/${id}`), {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new MedicalLeavesApiError(
      await parseErrorMessage(response, 'No se pudo cargar el detalle'),
      response.status,
    );
  }
  return (await response.json()) as MedicalLeaveDetail;
}

export async function registerMedicalLeave(
  input: CreateMedicalLeaveInput,
): Promise<MedicalLeaveDetail> {
  const response = await fetch(buildPayrollUrl('/medical-leaves'), {
    method: 'POST',
    headers: authHeaders('application/json'),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new MedicalLeavesApiError(
      await parseErrorMessage(response, 'No se pudo registrar la incapacidad'),
      response.status,
    );
  }
  return (await response.json()) as MedicalLeaveDetail;
}

export async function updateMedicalLeaveStatus(
  id: string,
  input: UpdateMedicalLeaveStatusInput,
): Promise<MedicalLeaveRecord> {
  const response = await fetch(buildPayrollUrl(`/medical-leaves/${id}/status`), {
    method: 'PATCH',
    headers: authHeaders('application/json'),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new MedicalLeavesApiError(
      await parseErrorMessage(response, 'No se pudo actualizar el estado'),
      response.status,
    );
  }
  return (await response.json()) as MedicalLeaveRecord;
}

export async function uploadMedicalLeaveSupportDocument(
  id: string,
  file: File,
): Promise<MedicalLeaveRecord> {
  const validationError = validateMedicalLeaveSupportFile(file);
  if (validationError) {
    throw new MedicalLeavesApiError(validationError, 400);
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(buildPayrollUrl(`/medical-leaves/${id}/support-document`), {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!response.ok) {
    throw new MedicalLeavesApiError(
      await parseErrorMessage(response, 'No se pudo adjuntar el soporte'),
      response.status,
    );
  }
  return (await response.json()) as MedicalLeaveRecord;
}

export async function fetchMedicalLeaveSupportDocumentUrl(id: string): Promise<string> {
  const response = await fetch(buildPayrollUrl(`/medical-leaves/${id}/support-document/url`), {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new MedicalLeavesApiError(
      await parseErrorMessage(response, 'No se pudo obtener el enlace de descarga'),
      response.status,
    );
  }
  const payload = (await response.json()) as { url: string };
  return payload.url;
}

export async function deleteMedicalLeave(id: string): Promise<MedicalLeaveRecord> {
  const response = await fetch(buildPayrollUrl(`/medical-leaves/${id}`), {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new MedicalLeavesApiError(
      await parseErrorMessage(response, 'No se pudo eliminar la incapacidad'),
      response.status,
    );
  }
  return (await response.json()) as MedicalLeaveRecord;
}
