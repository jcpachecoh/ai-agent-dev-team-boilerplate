import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from './App';

describe('Inventory routes', () => {
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

  it.each([
    ['/inventory', /dashboard de inventario/i],
    ['/inventory/products', /gestión de productos/i],
    ['/inventory/movements', /movimientos de stock/i],
    ['/inventory/alerts', /alertas de stock bajo/i],
    ['/inventory/reports', /reportes de inventario/i],
  ])('renders %s', async (path, heading) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    });
  });
});
