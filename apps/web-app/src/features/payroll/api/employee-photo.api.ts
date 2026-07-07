import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';

export interface UploadEmployeePhotoResult {
  id: string;
  publicUrl: string | null;
  originalName: string;
}

export class EmployeePhotoApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmployeePhotoApiError';
  }
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function validateEmployeePhotoFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Solo se permiten archivos JPG, PNG o WebP';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'El archivo no puede superar 2 MB';
  }
  return null;
}

export async function uploadEmployeePhoto(
  employeeDetailsId: string,
  file: File,
): Promise<UploadEmployeePhotoResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('domain', 'USERS');
  formData.append('imageProfile', 'AVATAR');
  formData.append('entityType', 'EmployeeDetails');
  formData.append('entityId', employeeDetailsId);
  formData.append('visibility', 'PUBLIC');

  const headers: Record<string, string> = {
    'x-tenant-id': getTenantId(),
    'apollo-require-preflight': '1',
  };

  const token = getGraphqlAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message;
    throw new EmployeePhotoApiError(message || 'No se pudo subir la foto del empleado.');
  }

  const result = (await response.json()) as UploadEmployeePhotoResult;
  if (!result.publicUrl) {
    throw new EmployeePhotoApiError('El storage no devolvió una URL pública para la foto.');
  }

  return result;
}
