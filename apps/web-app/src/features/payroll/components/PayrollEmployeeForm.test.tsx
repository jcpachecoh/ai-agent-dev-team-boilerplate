import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';

import { ThemeProvider } from '@/providers/ThemeProvider/ThemeProvider';

import type { PayrollEmployeeFormValues } from '../types/payroll.types';
import { PayrollEmployeeForm } from './PayrollEmployeeForm';

const TEST_LOCATIONS = [{ id: 'loc-1', name: 'Sede Palos de Leña 1', isActive: true }];
const TEST_ROLES = [{ id: 'role-1', code: 'MANAGER', name: 'Manager', isActive: true }];

const TEST_CATALOGS = {
  EPS: [{ id: 'eps-1', type: 'EPS' as const, name: 'Sura' }],
  ARL: [{ id: 'arl-1', type: 'ARL' as const, name: 'Sura' }],
  PENSION_FUND: [{ id: 'pen-1', type: 'PENSION_FUND' as const, name: 'Protección' }],
  CESANTIAS_FUND: [{ id: 'ces-1', type: 'CESANTIAS_FUND' as const, name: 'Protección' }],
  CAJA_COMPENSACION: [{ id: 'caja-1', type: 'CAJA_COMPENSACION' as const, name: 'Comfama' }],
  AREA: [{ id: 'area-1', type: 'AREA' as const, name: 'Administración' }],
  DEPARTMENT: [{ id: 'dep-1', type: 'DEPARTMENT' as const, name: 'Gerencia' }],
};

vi.mock('../hooks/useEmployeeCatalogOptions', () => ({
  useEmployeeCatalogsGrouped: () => ({
    isLoading: false,
    grouped: TEST_CATALOGS,
  }),
  buildCatalogSelectOptions: (options: Array<{ name: string }>, currentValue: string) => {
    const mapped = options.map((option) => ({ value: option.name, label: option.name }));
    if (currentValue && !mapped.some((option) => option.value === currentValue)) {
      mapped.unshift({ value: currentValue, label: currentValue });
    }
    return mapped;
  },
  catalogSelectPlaceholder: (loading: boolean, hasOptions: boolean) => {
    if (loading) return 'Cargando opciones...';
    if (!hasOptions) return 'No hay opciones configuradas';
    return 'Seleccionar';
  },
}));

function renderForm(
  props: Omit<React.ComponentProps<typeof PayrollEmployeeForm>, 'onCancel' | 'onSubmit'> & {
    onSubmit?: (values: PayrollEmployeeFormValues) => void;
  },
): ReturnType<typeof render> {
  const onSubmit = props.onSubmit ?? vi.fn();
  return render(
    <ThemeProvider initialTheme="dark">
      <PayrollEmployeeForm onCancel={() => undefined} onSubmit={onSubmit} {...props} />
    </ThemeProvider>,
  );
}

describe('PayrollEmployeeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows required validation error in create mode', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderForm({ mode: 'create', locations: TEST_LOCATIONS, roles: TEST_ROLES, onSubmit });

    await user.click(screen.getByRole('button', { name: 'Crear empleado' }));

    expect(screen.getByText('Nombre, correo y cédula son obligatorios.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits create payload when required fields are complete', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: PayrollEmployeeFormValues) => void>();

    renderForm({ mode: 'create', locations: TEST_LOCATIONS, roles: TEST_ROLES, onSubmit });

    await user.type(screen.getByLabelText('Nombre'), 'Carlos Perez');
    await user.type(screen.getByLabelText('Cédula'), '12345678');
    await user.type(screen.getByLabelText('Correo'), 'carlos@test.com');
    await user.type(screen.getByLabelText('Contraseña'), 'SecurePass123!');
    await user.click(screen.getByRole('button', { name: 'Rol' }));
    await user.click(screen.getByRole('option', { name: 'Manager' }));
    await user.click(screen.getByRole('button', { name: 'Sede' }));
    await user.click(screen.getByRole('option', { name: 'Sede Palos de Leña 1' }));
    await user.type(screen.getByLabelText('Salario'), '3000000');
    await user.click(screen.getByRole('button', { name: 'Área' }));
    await user.click(screen.getByRole('option', { name: 'Administración' }));
    await user.click(screen.getByRole('button', { name: 'Departamento' }));
    await user.click(screen.getByRole('option', { name: 'Gerencia' }));
    await user.click(screen.getByRole('button', { name: 'EPS' }));
    await user.click(screen.getByRole('option', { name: 'Sura' }));
    await user.click(screen.getByRole('button', { name: 'Fondo de pensión' }));
    await user.click(screen.getByRole('option', { name: 'Protección' }));
    await user.click(screen.getByRole('button', { name: 'Fondo de cesantías' }));
    await user.click(screen.getByRole('option', { name: 'Protección' }));
    await user.click(screen.getByRole('button', { name: 'ARL' }));
    await user.click(screen.getByRole('option', { name: 'Sura' }));
    await user.click(screen.getByRole('button', { name: 'Caja de compensación' }));
    await user.click(screen.getByRole('option', { name: 'Comfama' }));
    await user.click(screen.getByRole('button', { name: 'Crear empleado' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
