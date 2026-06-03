import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, vi } from 'vitest';

import * as authToken from '@/lib/auth-token';

import { TestQueryProvider } from '@/test-utils/query-client';

import App from './App';

vi.mock('@/lib/auth-token', () => ({
  isAuthenticated: vi.fn(() => true),
  getGraphqlAuthToken: vi.fn(() => 'test-token'),
  setGraphqlAuthToken: vi.fn(),
  clearGraphqlAuthToken: vi.fn(),
}));

describe('Inventory routes', () => {
  beforeEach(() => {
    vi.mocked(authToken.isAuthenticated).mockReturnValue(true);
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
    ['/inventory/products', /gestión de insumos/i],
    ['/inventory/categories', /categorías de insumos/i],
    ['/inventory/movements', /movimientos de stock/i],
    ['/inventory/alerts', /alertas de stock bajo/i],
    ['/inventory/reports', /reportes de inventario/i],
  ])('renders %s', async (path, heading) => {
    render(
      <TestQueryProvider>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </TestQueryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    });
  });
});
