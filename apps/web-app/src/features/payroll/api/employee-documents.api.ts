import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';
import type {
  CreateEmployeeDocumentInput,
  DocumentFileType,
  EmployeeDocument,
} from '../types/employee-document.types';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'x-tenant-id': getTenantId() };
  const token = getGraphqlAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function fetchEmployeeDocuments(
  employeeId: string,
  fileType?: DocumentFileType,
): Promise<EmployeeDocument[]> {
  const params = new URLSearchParams({ employeeId });
  if (fileType) params.set('fileType', fileType);

  const response = await fetch(`/api/employee-documents?${params.toString()}`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('No se pudieron cargar los documentos');
  return (await response.json()) as EmployeeDocument[];
}

export async function createEmployeeDocument(
  input: CreateEmployeeDocumentInput,
): Promise<EmployeeDocument> {
  const response = await fetch('/api/employee-documents', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'No se pudo registrar el documento');
  }
  return (await response.json()) as EmployeeDocument;
}

export async function fetchEmployeeDocumentDownloadUrl(documentId: string): Promise<string> {
  const response = await fetch(`/api/employee-documents/${documentId}/download`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('No se pudo obtener el enlace de descarga');
  const payload = (await response.json()) as { url: string };
  return payload.url;
}

export async function deleteEmployeeDocument(documentId: string): Promise<void> {
  const response = await fetch(`/api/employee-documents/${documentId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('No se pudo eliminar el documento');
}
