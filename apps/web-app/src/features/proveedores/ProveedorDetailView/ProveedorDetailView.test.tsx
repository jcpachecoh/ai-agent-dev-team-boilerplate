import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestQueryProvider } from '@/test-utils/query-client';

import * as queries from '../api/proveedores.queries';
import { mockSupplierApi, mockSupplierProductApi } from '../test/fixtures';
import ProveedorDetailView from './ProveedorDetailView';

vi.mock('@/lib/graphql-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/graphql-client')>();
  return {
    ...actual,
    isGraphqlConfigured: () => true,
  };
});

vi.mock('../api/proveedores.queries', () => ({
  fetchSuppliers: vi.fn(),
  fetchSupplier: vi.fn(),
  fetchSupplierProducts: vi.fn(),
  fetchSupplyItems: vi.fn(),
}));

function renderDetail(initialEntry = '/proveedores/sup-test-001'): void {
  render(
    <TestQueryProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/proveedores/:supplierId" element={<ProveedorDetailView />} />
        </Routes>
      </MemoryRouter>
    </TestQueryProvider>,
  );
}

describe('ProveedorDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.fetchSupplier).mockResolvedValue(mockSupplierApi);
    vi.mocked(queries.fetchSupplierProducts).mockResolvedValue([mockSupplierProductApi]);
    vi.mocked(queries.fetchSupplyItems).mockResolvedValue([]);
  });

  it('shows contact info on info tab', async () => {
    renderDetail();
    expect(await screen.findByText('carnes@example.com')).toBeInTheDocument();
  });

  it('switches to catalog tab content', async () => {
    const user = userEvent.setup();
    renderDetail();
    await screen.findByText('Carnes del Valle S.A.S');

    await user.click(screen.getByRole('button', { name: /catálogo/i }));
    expect(await screen.findByText('Lomo de Res Premium')).toBeInTheDocument();
  });

  it('shows placeholder on history tab', async () => {
    renderDetail('/proveedores/sup-test-001?tab=history');

    expect(await screen.findByText(/historial de órdenes de compra/i)).toBeInTheDocument();
  });
});
