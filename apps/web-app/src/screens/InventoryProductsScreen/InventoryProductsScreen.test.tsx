import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { InventoryProductsScreen } from './InventoryProductsScreen';

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

  it('renders product list and filters by POLLO search', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <InventoryProductsScreen />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /gestión de productos/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/POLLO ENTERO/i)).toBeInTheDocument();

    const search = screen.getByRole('textbox', { name: /buscar/i });
    await user.clear(search);
    await user.type(search, 'POLLO');

    await waitFor(() => {
      expect(screen.getByText(/POLLO ENTERO/i)).toBeInTheDocument();
      expect(screen.queryByText(/ARROZ BLANCO/i)).not.toBeInTheDocument();
    });
  });
});
