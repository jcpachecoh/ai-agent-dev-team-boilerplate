import { fireEvent, render, screen } from '@testing-library/react';

import type { CreatePayrollEmployeeInput } from '../types/payroll.types';
import { PayrollEmployeeForm } from './PayrollEmployeeForm';

describe('PayrollEmployeeForm', () => {
  it('shows required validation error in create mode', () => {
    const onSubmit = vi.fn();

    render(<PayrollEmployeeForm mode="create" onCancel={() => undefined} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Crear empleado' }));

    expect(screen.getByText('Nombre, email y cedula son obligatorios.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits create payload when required fields are complete', () => {
    const onSubmit = vi.fn<(payload: CreatePayrollEmployeeInput) => void>();

    render(<PayrollEmployeeForm mode="create" onCancel={() => undefined} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Carlos Perez' } });
    fireEvent.change(screen.getByLabelText('Cedula'), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'carlos@test.com' } });
    fireEvent.change(screen.getByLabelText('Contrasena'), { target: { value: 'SecurePass123!' } });
    fireEvent.change(screen.getByLabelText('Role ID'), {
      target: { value: 'role-1' },
    });
    fireEvent.change(screen.getByLabelText('Location ID'), { target: { value: 'loc-1' } });
    fireEvent.change(screen.getByLabelText('Salario'), { target: { value: '3000000' } });

    fireEvent.click(screen.getByRole('button', { name: 'Crear empleado' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
