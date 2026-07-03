import { getGraphqlAuthToken } from '@/lib/auth-token';
import { getTenantId } from '@/lib/tenant';

export interface UploadTenantLogoResponse {
  logoUrl: string;
}

export async function uploadTenantLogo(file: File): Promise<UploadTenantLogoResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {
    'x-tenant-id': getTenantId(),
  };

  const token = getGraphqlAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch('/api/tenant/logo', {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message;
    throw new Error(message || 'No se pudo subir el logo del restaurante.');
  }

  return (await response.json()) as UploadTenantLogoResponse;
}

export function resolveTenantLogoUrl(logoUrl?: string | null): string | undefined {
  if (!logoUrl) {
    return undefined;
  }

  if (/^https?:\/\//i.test(logoUrl)) {
    return logoUrl;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(logoUrl, window.location.origin).href;
  }

  return logoUrl;
}
