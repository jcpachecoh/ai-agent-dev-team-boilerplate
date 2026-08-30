import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestQueryProvider, createTestQueryClient } from '@/test-utils/query-client';

import * as mutations from '../api/proveedores.mutations';
import { proveedoresKeys } from '../api/proveedores.keys';
import { useCreateSupplierProduct } from './useSupplierProductMutations';
import { mockSupplierProductApi } from '../test/fixtures';

vi.mock('../api/proveedores.mutations', () => ({
  createSupplierProduct: vi.fn(),
  updateSupplierProduct: vi.fn(),
  deleteSupplierProduct: vi.fn(),
}));

describe('useCreateSupplierProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invalidates catalog query after successful create', async () => {
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    vi.mocked(mutations.createSupplierProduct).mockResolvedValue(mockSupplierProductApi);

    const { result } = renderHook(() => useCreateSupplierProduct('sup-test-001'), {
      wrapper: ({ children }) => <TestQueryProvider client={client}>{children}</TestQueryProvider>,
    });

    await result.current.mutateAsync({
      supplyItemId: 'si-test-002',
      precioUnitario: 1000,
      unidadCompra: 'KILOGRAMS',
      factorConversion: 1,
      tiempoEntregaDias: 1,
      esProveedorPrincipal: false,
    });

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: proveedoresKeys.products('sup-test-001'),
    });
  });
});
