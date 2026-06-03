import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { TestQueryProvider } from '@/test-utils/query-client';

import App from './App';

vi.mock('@/lib/auth-token', () => ({
  isAuthenticated: vi.fn(() => true),
  getGraphqlAuthToken: vi.fn(() => 'test-token'),
  setGraphqlAuthToken: vi.fn(),
  clearGraphqlAuthToken: vi.fn(),
}));

const inventoryRestPayload = {
  dashboard: {
    totalItems: 1,
    totalValue: 0,
    lowStockCount: 0,
    movementsToday: 0,
    topProducts: [],
    stockBySite: [],
    historyOccupancy: [],
  },
  alerts: [] as unknown[],
  summary: { critical: 0, warning: 0, resolvedToday: 0 },
  report: { rows: [], distribution: [], summary: [] },
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/inventory/dashboard')) {
        return new Response(JSON.stringify(inventoryRestPayload.dashboard), { status: 200 });
      }
      if (url.includes('/inventory/alerts/summary')) {
        return new Response(JSON.stringify(inventoryRestPayload.summary), { status: 200 });
      }
      if (url.includes('/inventory/alerts')) {
        return new Response(JSON.stringify(inventoryRestPayload.alerts), { status: 200 });
      }
      if (url.includes('/inventory/reports')) {
        return new Response(JSON.stringify(inventoryRestPayload.report), { status: 200 });
      }
      return new Response('{}', { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

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
