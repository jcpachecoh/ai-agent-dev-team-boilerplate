import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ThemeProvider } from '@/providers/ThemeProvider/ThemeProvider';

import type { PayrollEmployeeFormValues } from '../types/payroll.types';
import { PayrollEmployeeForm } from './PayrollEmployeeForm';

const TEST_LOCATIONS = [{ id: 'loc-1', name: 'Sede Palos de Leña 1', isActive: true }];
const TEST_ROLES = [{ id: 'role-1', code: 'MANAGER', name: 'Manager', isActive: true }];

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
  it('shows required validation error in create mode', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderForm({ mode: 'create', locations: TEST_LOCATIONS, roles: TEST_ROLES, onSubmit });

    await user.click(screen.getByRole('button', { name: 'Crear empleado' }));

    expect(screen.getByText('Nombre, email y cedula son obligatorios.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits create payload when required fields are complete', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(values: PayrollEmployeeFormValues) => void>();

    renderForm({ mode: 'create', locations: TEST_LOCATIONS, roles: TEST_ROLES, onSubmit });

    await user.type(screen.getByLabelText('Nombre'), 'Carlos Perez');
    await user.type(screen.getByLabelText('Cedula'), '12345678');
    await user.type(screen.getByLabelText('Email'), 'carlos@test.com');
    await user.type(screen.getByLabelText('Contrasena'), 'SecurePass123!');
    await user.click(screen.getByRole('button', { name: 'Rol' }));
    await user.click(screen.getByRole('option', { name: 'Manager' }));
    await user.click(screen.getByRole('button', { name: 'Sede' }));
    await user.click(screen.getByRole('option', { name: 'Sede Palos de Leña 1' }));
    await user.type(screen.getByLabelText('Salario'), '3000000');
    await user.click(screen.getByRole('button', { name: 'Crear empleado' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
