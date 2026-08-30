import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';
import { buildPayrollUrl } from './payroll.client';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'x-tenant-id': getTenantId(),
    'apollo-require-preflight': '1',
  };
  const token = getGraphqlAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function validateEmployeeAssetFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Solo se permiten archivos PDF, JPG, PNG o WEBP';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `El archivo no puede superar ${MAX_SIZE_BYTES / 1024 / 1024} MB`;
  }
  return null;
}

export async function uploadEmployeeDocument(
  employeeId: string,
  file: File,
): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('domain', 'PAYROLL');
  formData.append('entityType', 'Employee');
  formData.append('entityId', employeeId);
  formData.append('visibility', 'PRIVATE');

  const response = await fetch(buildPayrollUrl('/storage/upload'), {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'No se pudo subir el archivo');
  }

  return (await response.json()) as { id: string };
}

export async function fetchEmployeeAssetDownloadUrl(assetId: string): Promise<string> {
  const response = await fetch(buildPayrollUrl(`/employee-assets/${assetId}/download`), {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener la URL de descarga');
  }

  const payload = (await response.json()) as { url: string };
  return payload.url;
}
