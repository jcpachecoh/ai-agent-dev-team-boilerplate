import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';

import { ThemeProvider } from '@/providers/ThemeProvider/ThemeProvider';

import type { PayrollEmployeeFormValues } from '../types/payroll.types';
import { PayrollEmployeeForm } from './PayrollEmployeeForm';

const TEST_LOCATIONS = [{ id: 'loc-1', name: 'Sede Palos de Leña 1', isActive: true }];

const TEST_CATALOGS = {
  EPS: [{ id: 'eps-1', type: 'EPS' as const, name: 'Sura' }],
  ARL: [{ id: 'arl-1', type: 'ARL' as const, name: 'Sura' }],
  PENSION_FUND: [{ id: 'pen-1', type: 'PENSION_FUND' as const, name: 'Protección' }],
  CESANTIAS_FUND: [{ id: 'ces-1', type: 'CESANTIAS_FUND' as const, name: 'Protección' }],
  CAJA_COMPENSACION: [{ id: 'caja-1', type: 'CAJA_COMPENSACION' as const, name: 'Comfama' }],
  AREA: [{ id: 'area-1', type: 'AREA' as const, name: 'Administración' }],
  DEPARTMENT: [{ id: 'dep-1', type: 'DEPARTMENT' as const, name: 'Gerencia' }],
};

const TEST_POSITIONS = [
  {
    id: 'pos-1',
    title: 'Programador',
    area: 'Administración',
    baseSalaryRange: 4500000,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

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

vi.mock('../hooks/useEmployeePositions', () => ({
  useEmployeePositions: () => ({
    isLoading: false,
    isError: false,
    data: TEST_POSITIONS,
  }),
}));

vi.mock('../api/personal-data.client', () => ({
  getColombiaDepartments: () => Promise.resolve([{ code: '11', name: 'Bogotá D.C.' }]),
  getColombiaCities: () => Promise.resolve(['Bogotá D.C.']),
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

    renderForm({ mode: 'create', locations: TEST_LOCATIONS, onSubmit });

    await user.click(screen.getByRole('button', { name: 'Crear empleado' }));

    expect(
      screen.getByText('Primer nombre, primer apellido, correo y cédula son obligatorios.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits create payload when required fields are complete', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: PayrollEmployeeFormValues) => void>();

    renderForm({ mode: 'create', locations: TEST_LOCATIONS, onSubmit });

    await user.type(screen.getByLabelText('Primer nombre'), 'Carlos');
    await user.type(screen.getByLabelText('Primer apellido'), 'Perez');
    await user.type(screen.getByLabelText('Cédula'), '12345678');
    await user.type(screen.getByLabelText('Correo'), 'carlos@test.com');
    await user.click(screen.getByRole('button', { name: 'Sedes' }));
    await user.click(screen.getByRole('option', { name: 'Sede Palos de Leña 1' }));
    await user.click(screen.getByRole('button', { name: 'Cargo' }));
    await user.click(screen.getByRole('option', { name: 'Programador' }));
    await user.type(screen.getByLabelText('Salario'), '3000000');
    await user.click(screen.getByRole('button', { name: 'Área' }));
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
    expect(onSubmit.mock.calls[0][0].primerNombre).toBe('Carlos');
    expect(onSubmit.mock.calls[0][0].primerApellido).toBe('Perez');
    expect(onSubmit.mock.calls[0][0].positionId).toBe('pos-1');
    expect(onSubmit.mock.calls[0][0].area).toBe('Administración');
  });

  it('CONN-06: al seleccionar Rotante bloquea y limpia Áreas; al volver a otro centro, Áreas vuelve a ser editable', async () => {
    const user = userEvent.setup();

    renderForm({ mode: 'create', locations: TEST_LOCATIONS });

    await user.click(screen.getByRole('button', { name: 'Sedes' }));
    await user.click(screen.getByRole('option', { name: 'Sede Palos de Leña 1' }));
    expect(screen.getByRole('button', { name: 'Sedes' })).toHaveTextContent('Sede Palos de Leña 1');

    await user.click(screen.getByRole('button', { name: 'Centro de Costos' }));
    await user.click(screen.getByRole('option', { name: 'Rotante' }));

    const areasButton = screen.getByRole('button', { name: 'Sedes' });
    expect(areasButton).toBeDisabled();
    expect(areasButton).toHaveTextContent('No aplica para Rotante');
    expect(
      screen.getByText('La sede se determina automáticamente por turno o marcación diaria.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Centro de Costos' }));
    await user.click(screen.getByRole('option', { name: 'Operaciones' }));

    expect(screen.getByRole('button', { name: 'Sedes' })).not.toBeDisabled();
  });

  it('CONN-06: no exige Áreas cuando el Centro de Costos es Rotante', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: PayrollEmployeeFormValues) => void>();

    renderForm({ mode: 'create', locations: TEST_LOCATIONS, onSubmit });

    await user.type(screen.getByLabelText('Primer nombre'), 'Ana');
    await user.type(screen.getByLabelText('Primer apellido'), 'Rotante');
    await user.type(screen.getByLabelText('Cédula'), '87654321');
    await user.type(screen.getByLabelText('Correo'), 'ana@test.com');
    await user.click(screen.getByRole('button', { name: 'Centro de Costos' }));
    await user.click(screen.getByRole('option', { name: 'Rotante' }));
    await user.click(screen.getByRole('button', { name: 'Cargo' }));
    await user.click(screen.getByRole('option', { name: 'Programador' }));
    await user.type(screen.getByLabelText('Salario'), '3000000');
    await user.click(screen.getByRole('button', { name: 'Área' }));
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
    expect(onSubmit.mock.calls[0][0].costCenter).toBe('ROTANTE');
    expect(onSubmit.mock.calls[0][0].locationId).toBe('');
  });
});
