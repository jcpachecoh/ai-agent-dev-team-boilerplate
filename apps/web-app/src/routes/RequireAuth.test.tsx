import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authToken from '@/lib/auth-token';

import { RequireAuth } from './RequireAuth';

vi.mock('@/lib/auth-token', () => ({
  isAuthenticated: vi.fn(),
}));

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders child routes when a token exists', () => {
    vi.mocked(authToken.isAuthenticated).mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/proveedores']}>
        <Routes>
          <Route path="/login" element={<p>Login</p>} />
          <Route element={<RequireAuth />}>
            <Route path="/proveedores" element={<p>Proveedores</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Proveedores')).toBeInTheDocument();
  });

  it('redirects to /login when there is no token', () => {
    vi.mocked(authToken.isAuthenticated).mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={['/proveedores']}>
        <Routes>
          <Route path="/login" element={<p>Login</p>} />
          <Route element={<RequireAuth />}>
            <Route path="/proveedores" element={<p>Proveedores</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Proveedores')).not.toBeInTheDocument();
  });
});
