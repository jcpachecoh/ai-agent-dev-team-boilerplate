import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmployeePositionForm } from './EmployeePositionForm';
import type { EmployeePositionFormValues } from '../types/employee-position.types';

const TEST_POSITIONS = [
  {
    id: 'pos-boss',
    title: 'Gerente General',
    area: 'Gerencia',
    baseSalaryRange: 12000000,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    supervisors: [],
  },
  {
    id: 'pos-1',
    title: 'Contador',
    area: 'Finanzas',
    baseSalaryRange: 4500000,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    supervisors: [{ id: 'pos-boss', title: 'Gerente General' }],
  },
  {
    id: 'pos-inactive-boss',
    title: 'Ex Director Regional',
    area: 'Gerencia',
    baseSalaryRange: 9000000,
    isActive: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    supervisors: [],
  },
  {
    id: 'pos-2',
    title: 'Analista',
    area: 'Finanzas',
    baseSalaryRange: 3500000,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    supervisors: [{ id: 'pos-inactive-boss', title: 'Ex Director Regional' }],
  },
];

vi.mock('../hooks/useEmployeeCatalogOptions', () => ({
  useEmployeeCatalogOptions: () => ({
    isLoading: false,
    isError: false,
    data: [{ id: 'area-1', type: 'AREA', name: 'Finanzas' }],
  }),
  buildCatalogSelectOptions: (options: Array<{ name: string }>, currentValue: string) => {
    const mapped = options.map((option) => ({ value: option.name, label: option.name }));
    if (currentValue && !mapped.some((option) => option.value === currentValue)) {
      mapped.unshift({ value: currentValue, label: currentValue });
    }
    return mapped;
  },
  catalogSelectPlaceholder: (loading: boolean, hasOptions: boolean) => {
    if (loading) {
      return 'Cargando áreas...';
    }
    if (!hasOptions) {
      return 'No hay áreas configuradas';
    }
    return 'Seleccionar área';
  },
}));

vi.mock('../hooks/useEmployeePositions', () => ({
  useEmployeePositions: () => ({
    isLoading: false,
    isError: false,
    data: TEST_POSITIONS,
  }),
}));

function renderForm(
  props: Omit<React.ComponentProps<typeof EmployeePositionForm>, 'onCancel' | 'onSubmit'> & {
    onSubmit?: (values: EmployeePositionFormValues) => void;
  },
): ReturnType<typeof render> {
  const onSubmit = props.onSubmit ?? vi.fn();
  return render(<EmployeePositionForm onCancel={() => undefined} onSubmit={onSubmit} {...props} />);
}

/** Completa nombre, área y salario — los campos base obligatorios del formulario. */
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText('Nombre del cargo'), 'Contador');
  await user.click(screen.getByRole('button', { name: 'Área' }));
  await user.click(screen.getByRole('option', { name: 'Finanzas' }));
  await user.type(screen.getByLabelText('Salario base (COP)'), '3000000');
}

describe('EmployeePositionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits create payload with an empty supervisorPositionIds by default', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: EmployeePositionFormValues) => void>();

    renderForm({ mode: 'create', onSubmit });
    await fillRequiredFields(user);

    await user.click(screen.getByRole('button', { name: 'Crear cargo' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].supervisorPositionIds).toEqual([]);
  });

  it('submits create payload with the selected supervisorPositionIds', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: EmployeePositionFormValues) => void>();

    renderForm({ mode: 'create', onSubmit });
    await fillRequiredFields(user);

    await user.click(screen.getByText('Seleccionar cargo(s) supervisor(es)'));
    await user.click(screen.getByText('Gerente General'));
    await user.click(screen.getByRole('button', { name: 'Crear cargo' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].supervisorPositionIds).toEqual(['pos-boss']);
  });

  it('preloads existing supervisors when editing', () => {
    renderForm({ mode: 'edit', initialValues: TEST_POSITIONS[1] });

    expect(screen.getByText('Gerente General')).toBeInTheDocument();
  });

  it('excludes the position itself from the supervisor options when editing', async () => {
    const user = userEvent.setup();

    renderForm({ mode: 'edit', initialValues: TEST_POSITIONS[1] });

    // Al momento del click solo existe un nodo "Gerente General" (el chip ya
    // seleccionado); el click abre el combobox al burbujear hacia el trigger.
    await user.click(screen.getByText('Gerente General'));

    expect(screen.queryByText('Contador')).not.toBeInTheDocument();
  });

  it('preloads an inactive supervisor with its title and an inactive marker, and keeps it on submit untouched', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: EmployeePositionFormValues) => void>();

    // pos-2 (Analista) tiene a pos-inactive-boss (Ex Director Regional, isActive: false)
    // como supervisor asignado.
    renderForm({ mode: 'edit', initialValues: TEST_POSITIONS[3], onSubmit });

    // Debe seguir mostrando el título real (no el id crudo) y distinguirse como inactivo.
    expect(screen.getByText('Ex Director Regional (Inactivo)')).toBeInTheDocument();
    expect(screen.queryByText('pos-inactive-boss')).not.toBeInTheDocument();

    // Guardar sin tocar el campo no debe eliminar la relación con el supervisor inactivo.
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].supervisorPositionIds).toEqual(['pos-inactive-boss']);
  });

  it('filters the supervisor options as the user types in the search box', async () => {
    const user = userEvent.setup();

    renderForm({ mode: 'create' });

    await user.click(screen.getByText('Seleccionar cargo(s) supervisor(es)'));
    // Antes del fix, el buscador no filtraba nada — todas las opciones seguían visibles
    // sin importar lo que se tipeara.
    expect(screen.getByText('Contador')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Buscar...'), 'gerente');

    await waitFor(() => {
      expect(screen.queryByText('Contador')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Gerente General')).toBeInTheDocument();
  });

  it('does not offer an inactive position as a new supervisor assignment for a different cargo', async () => {
    const user = userEvent.setup();

    // TEST_POSITIONS[1] (Contador) ya tiene a pos-boss asignado (chip visible); no tiene a
    // pos-inactive-boss. Clickear el chip existente abre el combobox al burbujear al trigger.
    renderForm({ mode: 'edit', initialValues: TEST_POSITIONS[1] });

    await user.click(screen.getByText('Gerente General'));

    expect(screen.queryByText('Ex Director Regional (Inactivo)')).not.toBeInTheDocument();
    expect(screen.queryByText('Ex Director Regional')).not.toBeInTheDocument();
  });

  it('allows removing a preloaded supervisor and submits the updated set', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: EmployeePositionFormValues) => void>();

    renderForm({ mode: 'edit', initialValues: TEST_POSITIONS[1], onSubmit });

    const chip = screen.getByText('Gerente General').closest('div');
    const removeButton = chip?.querySelector('button');
    expect(removeButton).toBeTruthy();
    await user.click(removeButton as HTMLButtonElement);

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].supervisorPositionIds).toEqual([]);
  });
});
