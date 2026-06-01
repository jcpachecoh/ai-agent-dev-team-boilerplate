import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestQueryProvider } from '@/test-utils/query-client';

import ProveedorFormView from './ProveedorFormView';

vi.mock('../hooks/useSupplierMutations', () => ({
  useCreateSupplier: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateSupplier: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteSupplier: () => ({ mutate: vi.fn(), isPending: false }),
}));

function renderCreateForm(): void {
  render(
    <TestQueryProvider>
      <MemoryRouter initialEntries={['/proveedores/nuevo']}>
        <Routes>
          <Route path="/proveedores/nuevo" element={<ProveedorFormView mode="create" />} />
        </Routes>
      </MemoryRouter>
    </TestQueryProvider>,
  );
}

describe('ProveedorFormView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables save when required fields are empty', () => {
    renderCreateForm();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled();
  });
});
