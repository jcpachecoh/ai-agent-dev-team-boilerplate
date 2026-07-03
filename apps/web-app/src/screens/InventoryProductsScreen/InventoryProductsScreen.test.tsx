import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { LocationSessionProvider } from '@/features/auth/context/LocationSessionContext';
import { seedProducts } from '@/mocks/inventory/seed';
import { TestQueryProvider } from '@/test-utils/query-client';

import { InventoryProductsScreen } from './InventoryProductsScreen';

vi.mock('@/features/inventario/hooks/useSupplyItems', () => ({
  useSupplyItems: () => ({
    data: seedProducts,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/features/inventario/hooks/useSupplyCategories', () => ({
  useSupplyCategories: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/features/inventario/hooks/useSupplyItemMutations', () => ({
  useCreateSupplyItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateSupplyItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useToggleSupplyItemStatus: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('InventoryProductsScreen', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('1024px'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('renders supply list and filters by POLLO search', async () => {
    const user = userEvent.setup();

    render(
      <TestQueryProvider>
        <LocationSessionProvider>
          <MemoryRouter>
            <InventoryProductsScreen />
          </MemoryRouter>
        </LocationSessionProvider>
      </TestQueryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /gestión de insumos/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/POLLO ENTERO/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sede Salitre/i).length).toBeGreaterThan(0);

    const search = screen.getByRole('textbox', { name: /buscar/i });
    await user.clear(search);
    await user.type(search, 'POLLO');

    await waitFor(() => {
      expect(screen.getByText(/POLLO ENTERO/i)).toBeInTheDocument();
      expect(screen.queryByText(/ARROZ BLANCO/i)).not.toBeInTheDocument();
    });
  });
});
