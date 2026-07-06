import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AttendanceCollaboratorsScreen } from './AttendanceCollaboratorsScreen';

const listAttendanceCollaboratorsMock = vi.fn();
const listAttendanceCollaboratorSupervisorsMock = vi.fn();
const patchAttendanceCollaboratorPortalMock = vi.fn();
const exportAttendanceCollaboratorsMock = vi.fn();
const emailAttendanceCollaboratorsExportMock = vi.fn();
const getAttendanceCollaboratorAuditMock = vi.fn();

vi.mock('../api/attendance.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/attendance.client')>();
  return {
    ...actual,
    listAttendanceCollaborators: (...args: unknown[]) => listAttendanceCollaboratorsMock(...args),
    listAttendanceCollaboratorSupervisors: (...args: unknown[]) =>
      listAttendanceCollaboratorSupervisorsMock(...args),
    patchAttendanceCollaboratorPortal: (...args: unknown[]) =>
      patchAttendanceCollaboratorPortalMock(...args),
    exportAttendanceCollaborators: (...args: unknown[]) =>
      exportAttendanceCollaboratorsMock(...args),
    emailAttendanceCollaboratorsExport: (...args: unknown[]) =>
      emailAttendanceCollaboratorsExportMock(...args),
    getAttendanceCollaboratorAudit: (...args: unknown[]) =>
      getAttendanceCollaboratorAuditMock(...args),
  };
});

const downloadBlobMock = vi.fn();

vi.mock('../api/turnos.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/turnos.api')>();
  return {
    ...actual,
    downloadBlob: (...args: unknown[]) => downloadBlobMock(...args),
  };
});

const listEmployeePositionsMock = vi.fn();

vi.mock('@/features/payroll/api/employee-positions.api', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/payroll/api/employee-positions.api')>();
  return {
    ...actual,
    listEmployeePositions: (...args: unknown[]) => listEmployeePositionsMock(...args),
  };
});

const useMeMock = vi.fn();

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: () => useMeMock(),
}));

vi.mock('../hooks/useAttendanceScopeLocations', () => ({
  useAttendanceScopeLocations: () => ({
    locations: [{ id: 'loc-1', name: 'Sede Norte', isActive: true }],
    isLoading: false,
    error: null,
    isSystemAdmin: true,
    isGeneralScope: true,
  }),
}));

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function buildCollaborator(overrides: Record<string, unknown> = {}) {
  return {
    id: 'emp-1',
    userId: 'user-1',
    locationId: 'loc-1',
    locationName: 'Sede Norte',
    name: 'Ana Pérez',
    primerApellido: 'Pérez',
    segundoApellido: 'Gómez',
    cedula: '123456',
    email: 'ana@example.com',
    positionId: 'pos-1',
    positionName: 'Cocinero',
    area: 'Cocina',
    contractType: 'INDEFINIDO',
    laborClassification: 'COCINA',
    isActive: true,
    supervisors: [{ id: 'sup-1', name: 'Carlos Ruiz', email: 'carlos@example.com' }],
    todayShift: {
      type: 'ASSIGNED',
      turno: { id: 't-1', nombre: 'Mañana', sigla: 'TM', horaInicio: '06:00', horaFin: '14:00' },
    },
    portalWorkerEnabled: false,
    ...overrides,
  };
}

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/asistencia/colaboradores']}>
      <Routes>
        <Route path="/asistencia/colaboradores" element={<AttendanceCollaboratorsScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AttendanceCollaboratorsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMeMock.mockReturnValue({ data: { roleCode: 'OWNER', email: 'owner@restopsiq.dev' } });
    listEmployeePositionsMock.mockResolvedValue([]);
    listAttendanceCollaboratorSupervisorsMock.mockResolvedValue([
      { id: 'sup-1', name: 'Carlos Ruiz', email: 'carlos@example.com' },
    ]);
    listAttendanceCollaboratorsMock.mockResolvedValue({
      items: [buildCollaborator()],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      summary: { total: 1, active: 1, inactive: 0 },
    });
  });

  it('renderiza las columnas nuevas: apellidos, supervisor, turno y toggle de portal trabajador', async () => {
    renderScreen();

    await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0));

    expect(screen.getAllByText('Pérez').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gómez').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Carlos Ruiz').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TM 06:00-14:00').length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Portal trabajador').length).toBeGreaterThan(0);
  });

  it('muestra "Descanso" y "Turno Base" según el tipo de todayShift', async () => {
    listAttendanceCollaboratorsMock.mockResolvedValue({
      items: [buildCollaborator({ id: 'emp-rest', todayShift: { type: 'REST', turno: null } })],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      summary: { total: 1, active: 1, inactive: 0 },
    });

    renderScreen();

    await waitFor(() => expect(screen.getAllByText('Descanso').length).toBeGreaterThan(0));
  });

  it('muestra el empty state cuando no hay colaboradores para los filtros', async () => {
    listAttendanceCollaboratorsMock.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      summary: { total: 0, active: 0, inactive: 0 },
    });

    renderScreen();

    await waitFor(() =>
      expect(
        screen.getByText('No se encontraron colaboradores con los criterios ingresados'),
      ).toBeInTheDocument(),
    );
  });

  it('"ver tarjeta de asistencia" navega a la ruta correcta', async () => {
    renderScreen();

    await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0));

    const [viewButton] = screen.getAllByRole('button', { name: 'Ver tarjeta de asistencia' });
    fireEvent.click(viewButton);

    expect(navigateMock).toHaveBeenCalledWith(
      '/asistencia/asistencias/loc-1/employees/user-1/card',
    );
  });

  it('"Limpiar filtros" resetea el buscador', async () => {
    renderScreen();

    await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0));

    const searchInput = screen.getByRole('searchbox') ?? screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'josé' } });

    await waitFor(() => expect((searchInput as HTMLInputElement).value).toBe('josé'));

    const clearButton = screen.getByRole('button', { name: 'Limpiar filtros' });
    fireEvent.click(clearButton);

    await waitFor(() => expect((searchInput as HTMLInputElement).value).toBe(''));
  });

  it('cambiar el tamaño de página vuelve a consultar con el nuevo pageSize', async () => {
    renderScreen();

    await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0));

    const pageSizeTrigger = screen.getByRole('button', { name: 'Entradas por página' });
    fireEvent.click(pageSizeTrigger);

    const option50 = await screen.findByRole('option', { name: '50' });
    fireEvent.click(option50);

    await waitFor(() =>
      expect(listAttendanceCollaboratorsMock).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 50, page: 1 }),
      ),
    );
  });

  describe('Portal trabajador', () => {
    it('OWNER: el toggle está habilitado y clic llama al endpoint de patch', async () => {
      patchAttendanceCollaboratorPortalMock.mockResolvedValue({ portalWorkerEnabled: true });
      renderScreen();

      await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0));

      const [toggle] = screen.getAllByRole('checkbox');
      expect(toggle).not.toBeDisabled();

      fireEvent.click(toggle);

      await waitFor(() =>
        expect(patchAttendanceCollaboratorPortalMock).toHaveBeenCalledWith('emp-1', true),
      );
    });

    it('rol no admin (SUPERVISOR): el toggle está deshabilitado', async () => {
      useMeMock.mockReturnValue({ data: { roleCode: 'SUPERVISOR', email: 'sup@restopsiq.dev' } });
      renderScreen();

      await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0));

      const [toggle] = screen.getAllByRole('checkbox');
      expect(toggle).toBeDisabled();
    });
  });

  describe('Exportaciones', () => {
    it('Exportar Excel llama al endpoint con los filtros activos y descarga el blob', async () => {
      const blob = new Blob(['data']);
      exportAttendanceCollaboratorsMock.mockResolvedValue(blob);
      renderScreen();

      await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0));

      fireEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));

      await waitFor(() =>
        expect(exportAttendanceCollaboratorsMock).toHaveBeenCalledWith(
          'excel',
          expect.objectContaining({ status: 'all' }),
        ),
      );
      expect(downloadBlobMock).toHaveBeenCalledWith(blob, expect.stringMatching(/\.xlsx$/));
    });

    it('Exportar PDF llama al endpoint con los filtros activos y descarga el blob', async () => {
      const blob = new Blob(['data']);
      exportAttendanceCollaboratorsMock.mockResolvedValue(blob);
      renderScreen();

      await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0));

      fireEvent.click(screen.getByRole('button', { name: 'Exportar PDF' }));

      await waitFor(() =>
        expect(exportAttendanceCollaboratorsMock).toHaveBeenCalledWith(
          'pdf',
          expect.objectContaining({ status: 'all' }),
        ),
      );
      expect(downloadBlobMock).toHaveBeenCalledWith(blob, expect.stringMatching(/\.pdf$/));
    });
  });

  describe('Enviar por correo', () => {
    it('el botón Enviar del modal está deshabilitado hasta que los destinatarios son válidos', async () => {
      renderScreen();

      await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0));

      fireEvent.click(screen.getByRole('button', { name: 'Enviar por correo' }));

      const sendButton = await screen.findByRole('button', { name: 'Enviar' });
      expect(sendButton).toBeDisabled();

      const textarea = screen.getByPlaceholderText(/correo1@empresa.com/);
      fireEvent.change(textarea, { target: { value: 'no-es-un-email' } });
      expect(sendButton).toBeDisabled();

      fireEvent.change(textarea, { target: { value: 'a@example.com, b@example.com' } });
      await waitFor(() => expect(sendButton).not.toBeDisabled());

      emailAttendanceCollaboratorsExportMock.mockResolvedValue({ sent: true });
      fireEvent.click(sendButton);

      await waitFor(() =>
        expect(emailAttendanceCollaboratorsExportMock).toHaveBeenCalledWith(
          expect.objectContaining({
            recipients: ['a@example.com', 'b@example.com'],
            format: 'excel',
          }),
        ),
      );
    });
  });

  describe('Historial de auditoría', () => {
    it('OWNER: botón "Ver historial de cambios" abre el modal y carga registros', async () => {
      getAttendanceCollaboratorAuditMock.mockResolvedValue([
        {
          id: 'audit-1',
          action: 'UPDATE',
          actorName: 'owner@example.com',
          createdAt: '2026-07-01T00:00:00.000Z',
          oldValue: { portalWorkerEnabled: false },
          newValue: { portalWorkerEnabled: true },
        },
      ]);
      renderScreen();

      await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0));

      const [historyButton] = screen.getAllByRole('button', { name: 'Ver historial de cambios' });
      fireEvent.click(historyButton);

      await waitFor(() => expect(getAttendanceCollaboratorAuditMock).toHaveBeenCalledWith('emp-1'));
      expect(await screen.findByText('owner@example.com')).toBeInTheDocument();
    });

    it('muestra el mensaje vacío cuando no hay historial', async () => {
      getAttendanceCollaboratorAuditMock.mockResolvedValue([]);
      renderScreen();

      await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0));

      const [historyButton] = screen.getAllByRole('button', { name: 'Ver historial de cambios' });
      fireEvent.click(historyButton);

      expect(
        await screen.findByText('No hay historial de cambios para este colaborador'),
      ).toBeInTheDocument();
    });

    it('rol no admin (SUPERVISOR): el botón de historial no se muestra', async () => {
      useMeMock.mockReturnValue({ data: { roleCode: 'SUPERVISOR', email: 'sup@restopsiq.dev' } });
      renderScreen();

      await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0));

      expect(
        screen.queryByRole('button', { name: 'Ver historial de cambios' }),
      ).not.toBeInTheDocument();
    });
  });
});
