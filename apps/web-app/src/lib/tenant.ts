const DEFAULT_TENANT_ID = 'palos-de-lena';

export function getTenantId(): string {
  return import.meta.env.VITE_TENANT_ID ?? DEFAULT_TENANT_ID;
}
