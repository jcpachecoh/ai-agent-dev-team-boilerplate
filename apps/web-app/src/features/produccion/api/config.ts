function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '';
  if (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL) {
    return '';
  }
  return configured || (import.meta.env.PROD ? 'http://localhost:3001' : '');
}

export const plantApiConfig = {
  baseUrl: resolveApiBaseUrl(),
  tenantId: import.meta.env.VITE_TENANT_ID ?? 'palos-de-lena',
  /** Operational login for /api/plant/* (MES JWT). Defaults match prisma seed for palos-de-lena. */
  mesCedula: import.meta.env.VITE_MES_CEDULA ?? '12345678',
  mesPin: import.meta.env.VITE_MES_PIN ?? '1234',
};
