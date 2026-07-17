import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdministrativeOvertimeRequestModal } from './AdministrativeOvertimeRequestModal';

const useAttendanceScopeLocationsMock = vi.fn();
const useAttendanceCollaboratorsQueryMock = vi.fn();
const useEmployeeCatalogOptionsMock = vi.fn();
const canWritePayrollEmployeeMock = vi.fn();

vi.mock('../hooks/useAttendanceScopeLocations', () => ({
  useAttendanceScopeLocations: () => useAttendanceScopeLocationsMock(),
}));

vi.mock('../hooks/useAttendanceCollaboratorsQuery', () => ({
  useAttendanceCollaboratorsQuery: (...args: unknown[]) =>
    useAttendanceCollaboratorsQueryMock(...args),
}));

vi.mock('@/features/payroll/hooks/useEmployeeCatalogOptions', () => ({
  useEmployeeCatalogOptions: (...args: unknown[]) => useEmployeeCatalogOptionsMock(...args),
}));

vi.mock('@/config/rbac.config', async () => {
  const actual =
    await vi.importActual<typeof import('@/config/rbac.config')>('@/config/rbac.config');
  return {
    ...actual,
    canWritePayrollEmployee: (...args: unknown[]) => canWritePayrollEmployeeMock(...args),
  };
});

const locations = [
  { id: 'loc-1', name: 'Sede Centro', isActive: true },
  { id: 'loc-2', name: 'Sede Norte', isActive: true },
];

const collaboratorsLoc1 = [
  {
    id: 'emp-1',
    locationId: 'loc-1',
    name: 'Ana Pérez',
    cedula: '1001',
    positionName: 'Mesera',
  },
  {
    id: 'emp-2',
    locationId: 'loc-1',
    name: 'Luis Gómez',
    cedula: '1002',
    positionName: 'Cocinero',
  },
];

const collaboratorsLoc2 = [
  {
    id: 'emp-3',
    locationId: 'loc-2',
    name: 'María Ruiz',
    cedula: '2001',
    positionName: 'Cajera',
  },
];

const activeReasons = [
  { id: 'reason-1', name: 'Inventario físico semana', type: 'OVERTIME_REASON', isActive: true },
  { id: 'reason-2', name: 'Aseo', type: 'OVERTIME_REASON', isActive: true },
];

function renderModal(
  props: Partial<ComponentProps<typeof AdministrativeOvertimeRequestModal>> = {},
) {
  const onSubmit = props.onSubmit ?? vi.fn();
  const onClose = props.onClose ?? vi.fn();
  render(
    <MemoryRouter>
      <AdministrativeOvertimeRequestModal
        open
        roleCode="MANAGER"
        onClose={onClose}
        onSubmit={onSubmit}
        {...props}
      />
    </MemoryRouter>,
  );
  return { onSubmit, onClose };
}

describe('AdministrativeOvertimeRequestModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAttendanceScopeLocationsMock.mockReturnValue({
      locations,
      isLoading: false,
    });
    useAttendanceCollaboratorsQueryMock.mockImplementation(
      (filters: { locationId?: string }, enabled = true) => {
        if (!enabled || !filters.locationId) {
          return { data: undefined, isLoading: false };
        }
        const items = filters.locationId === 'loc-2' ? collaboratorsLoc2 : collaboratorsLoc1;
        return { data: { items }, isLoading: false };
      },
    );
    useEmployeeCatalogOptionsMock.mockReturnValue({
      data: activeReasons,
      isLoading: false,
    });
    canWritePayrollEmployeeMock.mockReturnValue(false);
  });

  it('abre y cierra el formulario', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    expect(
      screen.getByRole('dialog', { name: 'Solicitar extensión de jornada' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('carga solo motivos activos OVERTIME_REASON', () => {
    renderModal();

    expect(useEmployeeCatalogOptionsMock).toHaveBeenCalledWith('OVERTIME_REASON');
    expect(screen.getByRole('option', { name: 'Inventario físico semana' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Aseo' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Motivo inactivo' })).not.toBeInTheDocument();
  });

  it('muestra empty state de motivos con enlace a catálogos si el actor puede administrarlos', () => {
    useEmployeeCatalogOptionsMock.mockReturnValue({ data: [], isLoading: false });
    canWritePayrollEmployeeMock.mockReturnValue(true);

    renderModal({ roleCode: 'NOMINA' });

    expect(screen.getByText(/No hay motivos activos de extensión de jornada/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Catálogos de nómina' })).toHaveAttribute(
      'href',
      '/payroll/catalogs',
    );
  });

  it('filtra empleados por sede y limpia selección al cambiar sede', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.selectOptions(screen.getByLabelText('Sede'), 'loc-1');
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Luis Gómez')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Ana Pérez/));
    expect(screen.getByText('1 seleccionado(s)')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Sede'), 'loc-2');
    expect(screen.getByText('María Ruiz')).toBeInTheDocument();
    expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument();
    expect(screen.getByText('0 seleccionado(s)')).toBeInTheDocument();
  });

  it('permite multi-select de colaboradores', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.selectOptions(screen.getByLabelText('Sede'), 'loc-1');
    await user.click(screen.getByLabelText(/Ana Pérez/));
    await user.click(screen.getByLabelText(/Luis Gómez/));

    expect(screen.getByText('2 seleccionado(s)')).toBeInTheDocument();
  });

  it('envía el payload exacto sin campos derivados y soporta medianoche', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderModal({ onSubmit });

    await user.selectOptions(screen.getByLabelText('Sede'), 'loc-1');
    await user.click(screen.getByLabelText(/Ana Pérez/));
    await user.click(screen.getByLabelText(/Luis Gómez/));
    await user.selectOptions(screen.getByLabelText('Motivo'), 'reason-1');

    const workDate = screen.getByLabelText('Fecha de trabajo');
    await user.clear(workDate);
    await user.type(workDate, '2026-07-16');

    const start = screen.getByLabelText('Hora inicial propuesta');
    const end = screen.getByLabelText('Hora final propuesta');
    await user.clear(start);
    await user.type(start, '22:00');
    await user.clear(end);
    await user.type(end, '01:30');

    expect(screen.getByText(/cruza medianoche/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear solicitud' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0]![0] as Record<string, unknown>;
    expect(payload).toEqual({
      employeeIds: expect.arrayContaining(['emp-1', 'emp-2']),
      locationId: 'loc-1',
      workDate: '2026-07-16',
      proposedStartTime: '2026-07-16T22:00:00.000-05:00',
      proposedEndTime: '2026-07-17T01:30:00.000-05:00',
      reasonOptionId: 'reason-1',
    });
    expect(payload).not.toHaveProperty('tenantId');
    expect(payload).not.toHaveProperty('requestedByUserId');
    expect(payload).not.toHaveProperty('proposedMinutes');
    expect(payload).not.toHaveProperty('payrollPeriod');
    expect(payload).not.toHaveProperty('batchId');
    expect(payload).not.toHaveProperty('type');
    expect(payload).not.toHaveProperty('status');
    expect((payload.employeeIds as string[]).length).toBe(2);
  });

  it('deshabilita submit mientras loading para evitar doble envío', () => {
    renderModal({ loading: true });

    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  it('preselecciona sede única y evita selector innecesario', () => {
    useAttendanceScopeLocationsMock.mockReturnValue({
      locations: [locations[0]],
      isLoading: false,
    });

    renderModal();

    expect(screen.getByDisplayValue('Sede Centro')).toHaveAttribute('readonly');
    expect(screen.queryByRole('combobox', { name: 'Sede' })).not.toBeInTheDocument();
    expect(useAttendanceCollaboratorsQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ locationId: 'loc-1', status: 'active' }),
      true,
    );
  });

  it('muestra error funcional del backend', () => {
    renderModal({ errorMessage: 'Ya existe una solicitud solapada o duplicada.' });
    expect(
      within(screen.getByRole('alert')).getByText('Ya existe una solicitud solapada o duplicada.'),
    ).toBeInTheDocument();
  });
});
