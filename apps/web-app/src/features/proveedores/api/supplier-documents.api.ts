import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';

export type SupplierDocumentType =
  | 'RUT'
  | 'CAMARA_COMERCIO'
  | 'CEDULA_REPRESENTANTE_LEGAL'
  | 'CERTIFICACION_BANCARIA'
  | 'LISTA_PRECIOS'
  | 'CONTRATO_COMERCIAL'
  | 'POLIZAS'
  | 'CERTIFICACION_SANITARIA'
  | 'CONCEPTO_SANITARIO_INVIMA'
  | 'FICHA_TECNICA_PRODUCTO'
  | 'HOJA_SEGURIDAD'
  | 'CERTIFICADO_BPM'
  | 'ACUERDO_CONFIDENCIALIDAD'
  | 'TRATAMIENTO_DATOS_PERSONALES';

export type SupplierDocumentStatus = 'PENDING' | 'UPLOADED' | 'EXPIRING' | 'EXPIRED';
export type SupplierDocumentRequirement = 'REQUIRED' | 'CONDITIONAL' | 'RECOMMENDED';
export type SupplierDocumentAlertLevel = 'NONE' | 'WARNING' | 'URGENT';

export interface SupplierDocumentVersionApiModel {
  id: string;
  storageObjectId: string;
  versionNumber: number;
  mimeType: string;
  size: number;
  originalName: string;
}

export interface SupplierDocumentRowApiModel {
  documentType: SupplierDocumentType;
  label: string;
  requirement: SupplierDocumentRequirement;
  status: SupplierDocumentStatus;
  issuedAt: string | null;
  expiresAt: string | null;
  lastUploadedAt: string | null;
  uploadedByUserId: string | null;
  needsReview: boolean;
  alertLevel: SupplierDocumentAlertLevel;
  currentVersion: SupplierDocumentVersionApiModel | null;
  previousVersion: Pick<
    SupplierDocumentVersionApiModel,
    'id' | 'versionNumber' | 'mimeType' | 'originalName'
  > | null;
}

export interface SupplierDocumentsListResponse {
  completeness: {
    loaded: number;
    total: number;
    requiredPending: SupplierDocumentType[];
  };
  documents: SupplierDocumentRowApiModel[];
}

export class SupplierDocumentsApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupplierDocumentsApiError';
  }
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'x-tenant-id': getTenantId(),
  };
  const token = getGraphqlAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseError(response: Response, fallback: string): Promise<never> {
  const payload = (await response.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  const message = Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message;
  throw new SupplierDocumentsApiError(message || fallback);
}

export function validateSupplierDocumentFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Solo se permiten archivos PDF, JPG o PNG';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'El archivo no puede superar 5 MB';
  }
  return null;
}

export async function fetchSupplierDocuments(
  supplierId: string,
): Promise<SupplierDocumentsListResponse> {
  const response = await fetch(`/api/suppliers/${supplierId}/documents`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    await parseError(response, 'No se pudieron cargar los documentos del proveedor.');
  }
  return (await response.json()) as SupplierDocumentsListResponse;
}

export async function uploadSupplierDocumentStorage(
  supplierId: string,
  file: File,
): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('domain', 'SUPPLIERS');
  formData.append('entityType', 'Supplier');
  formData.append('entityId', supplierId);
  formData.append('visibility', 'PRIVATE');

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!response.ok) {
    await parseError(response, 'No se pudo subir el archivo.');
  }
  return (await response.json()) as { id: string };
}

export async function registerSupplierDocument(params: {
  supplierId: string;
  documentType: SupplierDocumentType;
  storageObjectId: string;
  issuedAt?: string;
}): Promise<SupplierDocumentsListResponse> {
  const response = await fetch(
    `/api/suppliers/${params.supplierId}/documents/${params.documentType}`,
    {
      method: 'POST',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storageObjectId: params.storageObjectId,
        issuedAt: params.issuedAt,
      }),
    },
  );
  if (!response.ok) {
    await parseError(response, 'No se pudo registrar el documento.');
  }
  return (await response.json()) as SupplierDocumentsListResponse;
}

export async function deleteSupplierDocument(
  supplierId: string,
  documentType: SupplierDocumentType,
): Promise<void> {
  const response = await fetch(`/api/suppliers/${supplierId}/documents/${documentType}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    await parseError(response, 'No se pudo eliminar el documento.');
  }
}

export async function fetchSupplierDocumentDownloadUrl(params: {
  supplierId: string;
  documentType: SupplierDocumentType;
  versionId?: string;
}): Promise<string> {
  const query = params.versionId ? `?versionId=${encodeURIComponent(params.versionId)}` : '';
  const response = await fetch(
    `/api/suppliers/${params.supplierId}/documents/${params.documentType}/download${query}`,
    { headers: authHeaders() },
  );
  if (!response.ok) {
    await parseError(response, 'No se pudo obtener la URL de descarga.');
  }
  const payload = (await response.json()) as { url: string };
  return payload.url;
}
