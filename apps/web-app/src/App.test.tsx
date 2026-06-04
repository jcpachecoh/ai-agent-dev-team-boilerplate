import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryClient } from '@/lib/query-client';
import * as authToken from '@/lib/auth-token';

import App from './App';

vi.mock('@/lib/auth-token', () => ({
  isAuthenticated: vi.fn(() => true),
  getGraphqlAuthToken: vi.fn(() => 'test-token'),
  setGraphqlAuthToken: vi.fn(),
  clearGraphqlAuthToken: vi.fn(),
}));

function renderApp(initialEntry = '/'): ReturnType<typeof render> {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
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

  it('renders dashboard at / when authenticated', () => {
    renderApp('/');

    expect(screen.getByRole('heading', { name: /restopsiq plant/i })).toBeInTheDocument();
    expect(screen.getByText(/estaciones activas/i)).toBeInTheDocument();
  });

  it('renders recipe categories at /recetas/categorias', () => {
    renderApp('/recetas/categorias');

    expect(screen.getByRole('heading', { name: /categorías de recetas/i })).toBeInTheDocument();
  });

  it('navigates to recetas module from sidebar', async () => {
    const user = userEvent.setup();

    renderApp('/');

    await user.click(screen.getByRole('button', { name: /recetas/i }));
    await user.click(screen.getByRole('link', { name: /lista de recetas/i }));

    expect(screen.getByRole('heading', { name: /administracion de recetas/i })).toBeInTheDocument();
  });

  it('renders NotFoundPage for unknown routes', () => {
    renderApp('/does-not-exist');

    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', () => {
    vi.mocked(authToken.isAuthenticated).mockReturnValue(false);

    renderApp('/');

    expect(screen.getByRole('heading', { name: /bienvenido de vuelta/i })).toBeInTheDocument();
  });
});
