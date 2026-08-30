import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestQueryProvider } from '@/test-utils/query-client';

import * as queries from '../api/proveedores.queries';
import { mockInactiveSupplierApi, mockSupplierApi } from '../test/fixtures';
import ProveedoresListView from './ProveedoresListView';

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

function renderList(): void {
  render(
    <TestQueryProvider>
      <MemoryRouter>
        <ProveedoresListView />
      </MemoryRouter>
    </TestQueryProvider>,
  );
}

describe('ProveedoresListView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queries.fetchSuppliers).mockResolvedValue([mockSupplierApi, mockInactiveSupplierApi]);
  });

  it('renders supplier table rows from API', async () => {
    renderList();
    expect(await screen.findByText('Carnes del Valle S.A.S')).toBeInTheDocument();
    expect(screen.getByText('Especias del Sur')).toBeInTheDocument();
  });

  it('filters rows by status client-side', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Carnes del Valle S.A.S');

    const statusSelect = screen.getByLabelText('Filtrar por estado');
    await user.selectOptions(statusSelect, 'inactive');

    expect(screen.queryByText('Carnes del Valle S.A.S')).not.toBeInTheDocument();
    expect(screen.getByText('Especias del Sur')).toBeInTheDocument();
  });
});
