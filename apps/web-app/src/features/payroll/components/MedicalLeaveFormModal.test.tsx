import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';

import { ThemeProvider } from '@/providers/ThemeProvider/ThemeProvider';

import { MEDICAL_LEAVE_180_DAY_WARNING } from '../utils/medical-leaves-display';
import { MedicalLeaveFormModal } from './MedicalLeaveFormModal';

const registerMutateAsync = vi.fn();
const uploadMutateAsync = vi.fn();

vi.mock('../hooks/useActivePayrollEmployeesQuery', () => ({
  useActivePayrollEmployeesQuery: () => ({
    data: [{ id: 'emp-1', name: 'Ana Pérez' }],
    isLoading: false,
  }),
}));

vi.mock('../hooks/useMedicalLeaveMutations', () => ({
  useMedicalLeaveMutations: () => ({
    registerMutation: {
      mutateAsync: registerMutateAsync,
      isPending: false,
    },
    uploadSupportMutation: {
      mutateAsync: uploadMutateAsync,
      isPending: false,
    },
  }),
}));

vi.mock('@restopsiq/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@restopsiq/ui')>();
  return {
    ...actual,
    Combobox: ({
      value,
      onChange,
      options,
    }: {
      value?: string;
      onChange?: (value: string | string[]) => void;
      options: Array<{ value: string; label: string }>;
    }) => (
      <select
        aria-label="medical-leave-employee"
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option value="">Seleccionar</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
    RecetaFilterSelect: ({
      value,
      onChange,
      options,
      id,
    }: {
      value?: string;
      onChange?: (value: string) => void;
      options: Array<{ value: string; label: string }>;
      id?: string;
    }) => (
      <select
        aria-label={id ?? 'filter-select'}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option value="">Seleccionar</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
  };
});

function renderModal(open = true) {
  return render(
    <ThemeProvider initialTheme="dark">
      <MedicalLeaveFormModal open={open} listFilters={{}} onClose={vi.fn()} />
    </ThemeProvider>,
  );
}

function attachSupportFile() {
  const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!fileInput) throw new Error('No se encontró el input de archivo');
  const file = new File(['soporte'], 'incapacidad.pdf', { type: 'application/pdf' });
  fireEvent.change(fileInput, { target: { files: [file] } });
}

describe('MedicalLeaveFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registerMutateAsync.mockResolvedValue({
      id: 'leave-1',
      employeeId: 'emp-1',
      origin: 'COMUN',
      startDate: '2026-03-01T00:00:00.000Z',
      endDate: '2026-03-05T00:00:00.000Z',
      totalDays: 5,
      employerPaidDays: 2,
      epsArlPaidDays: 3,
      employerAmount: 200000,
      epsArlAmount: 200010,
      supportStorageObjectId: null,
      status: 'REGISTRADA',
      annualAccumulatedDays: 185,
      exceeds180DayThreshold: true,
    });
  });

  it('valida que la fecha fin no sea anterior a la fecha inicio', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('medical-leave-employee'), {
      target: { value: 'emp-1' },
    });
    fireEvent.change(screen.getByLabelText('Fecha inicio'), {
      target: { value: '2026-03-10' },
    });
    fireEvent.change(screen.getByLabelText('Fecha fin'), {
      target: { value: '2026-03-01' },
    });
    attachSupportFile();

    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(
      await screen.findByText('La fecha fin debe ser posterior o igual a la fecha inicio'),
    ).toBeInTheDocument();
    expect(registerMutateAsync).not.toHaveBeenCalled();
  });

  it('exige el soporte médico antes de registrar la incapacidad', async () => {
    uploadMutateAsync.mockResolvedValue({ supportStorageObjectId: 'obj-1' });
    renderModal();

    fireEvent.change(screen.getByLabelText('medical-leave-employee'), {
      target: { value: 'emp-1' },
    });
    fireEvent.change(screen.getByLabelText('Fecha inicio'), {
      target: { value: '2026-03-01' },
    });
    fireEvent.change(screen.getByLabelText('Fecha fin'), {
      target: { value: '2026-03-05' },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(
      await screen.findByText('El soporte médico es obligatorio para registrar la incapacidad'),
    ).toBeInTheDocument();
    expect(registerMutateAsync).not.toHaveBeenCalled();

    attachSupportFile();
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() => {
      expect(registerMutateAsync).toHaveBeenCalled();
    });
    expect(uploadMutateAsync).toHaveBeenCalled();
  });

  it('muestra la alerta de 180 días cuando el API lo indica tras registrar', async () => {
    uploadMutateAsync.mockResolvedValue({ supportStorageObjectId: 'obj-1' });
    renderModal();

    fireEvent.change(screen.getByLabelText('medical-leave-employee'), {
      target: { value: 'emp-1' },
    });
    fireEvent.change(screen.getByLabelText('Fecha inicio'), {
      target: { value: '2026-03-01' },
    });
    fireEvent.change(screen.getByLabelText('Fecha fin'), {
      target: { value: '2026-03-05' },
    });
    attachSupportFile();

    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));

    await waitFor(() => {
      expect(registerMutateAsync).toHaveBeenCalled();
    });

    expect(uploadMutateAsync).toHaveBeenCalled();
    expect(await screen.findByText(MEDICAL_LEAVE_180_DAY_WARNING)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
