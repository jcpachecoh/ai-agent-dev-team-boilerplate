/** Use in-memory mock when true or when API base URL is unset. */
export function useInventoryMock(): boolean {
  const flag = import.meta.env.VITE_USE_MOCK_INVENTORY;
  if (flag === 'false') return false;
  if (flag === 'true') return true;
  return !import.meta.env.VITE_API_BASE_URL;
}

export const inventoryApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001',
  tenantId: import.meta.env.VITE_TENANT_ID ?? 'demo-tenant',
};
