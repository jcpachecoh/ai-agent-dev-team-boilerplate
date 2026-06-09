import { isGraphqlConfigured } from '@/lib/graphql-client';

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '';
  // Dev: use Vite proxy (/api → apps/api) unless an explicit base URL is set.
  if (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL) {
    return '';
  }
  return configured || (import.meta.env.PROD ? 'http://localhost:3001' : '');
}

/** Use in-memory mock only when GraphQL/REST is not available. */
export function useInventoryMock(): boolean {
  if (isGraphqlConfigured()) return false;

  const flag = import.meta.env.VITE_USE_MOCK_INVENTORY;
  if (flag === 'false') return false;
  if (flag === 'true') return true;

  return false;
}

/**
 * Stock movements list/adjust are not on the API yet (no GET /api/inventory/movements).
 * Keep mock data while insumos/alerts/reports use the real backend.
 */
export function useInventoryMovementsMock(): boolean {
  if (import.meta.env.VITE_USE_MOCK_INVENTORY_MOVEMENTS === 'false') return false;
  return true;
}

export const inventoryApiConfig = {
  baseUrl: resolveApiBaseUrl(),
  tenantId: import.meta.env.VITE_TENANT_ID ?? 'demo-tenant',
};
