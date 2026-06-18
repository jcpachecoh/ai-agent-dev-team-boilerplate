import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AppModule } from '@/config/rbac.config';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: vi.fn(),
}));

import { useMe } from '@/features/auth/hooks/useMe';

const useMeMock = vi.mocked(useMe);

describe('ProtectedRoute', () => {
  it('redirects NOMINA away from inventory module', () => {
    useMeMock.mockReturnValue({
      data: { roleCode: 'NOMINA' },
      isLoading: false,
      isFetching: false,
    } as ReturnType<typeof useMe>);

    render(
      <MemoryRouter initialEntries={['/inventory']}>
        <Routes>
          <Route
            path="/inventory"
            element={
              <ProtectedRoute module={AppModule.INVENTARIOS}>
                <div>Inventario</div>
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<div>No autorizado</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('No autorizado')).toBeInTheDocument();
  });

  it('renders children when role can access module', () => {
    useMeMock.mockReturnValue({
      data: { roleCode: 'MANAGER' },
      isLoading: false,
      isFetching: false,
    } as ReturnType<typeof useMe>);

    render(
      <MemoryRouter initialEntries={['/inventory']}>
        <Routes>
          <Route
            path="/inventory"
            element={
              <ProtectedRoute module={AppModule.INVENTARIOS}>
                <div>Inventario</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Inventario')).toBeInTheDocument();
  });

  it('waits for profile while loading when JWT has no role yet', () => {
    useMeMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
    } as ReturnType<typeof useMe>);

    render(
      <MemoryRouter initialEntries={['/payroll/employees']}>
        <Routes>
          <Route
            path="/payroll/employees"
            element={
              <ProtectedRoute module={AppModule.NOMINA}>
                <div>Empleados</div>
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<div>No autorizado</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Cargando permisos');
    expect(screen.queryByText('No autorizado')).not.toBeInTheDocument();
  });
});
