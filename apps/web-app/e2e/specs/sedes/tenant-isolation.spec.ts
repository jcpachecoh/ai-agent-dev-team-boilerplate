import { test } from '@playwright/test';

test.describe('Sedes — Aislamiento Multi-Tenant', () => {
  test.skip(
    true,
    'Requiere segundo tenant y credenciales E2E en seed — pendiente de datos de prueba multi-tenant.',
  );

  test('sede creada en tenant A no es visible en tenant B', async () => {
    // Placeholder hasta tener TEST_TENANT_ID_2 con usuarios en seed.
  });
});
