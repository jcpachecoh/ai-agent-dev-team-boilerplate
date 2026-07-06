import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { BulkAssignmentModal } from './BulkAssignmentModal';

const getAssignmentTemplateMock = vi.fn();
const importAssignmentsMock = vi.fn();
const downloadBlobMock = vi.fn();

vi.mock('../../api/turno-assignments.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/turno-assignments.api')>();
  return {
    ...actual,
    getAssignmentTemplate: (...args: unknown[]) => getAssignmentTemplateMock(...args),
    importAssignments: (...args: unknown[]) => importAssignmentsMock(...args),
  };
});

vi.mock('../../api/turnos.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/turnos.api')>();
  return {
    ...actual,
    downloadBlob: (...args: unknown[]) => downloadBlobMock(...args),
  };
});

function renderModal(overrides: Partial<React.ComponentProps<typeof BulkAssignmentModal>> = {}) {
  return render(
    <BulkAssignmentModal
      open
      selectedEmployeeIds={['emp-1', 'emp-2']}
      canOverridePastDate={false}
      onClose={vi.fn()}
      {...overrides}
    />,
  );
}

describe('BulkAssignmentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada si open es false', () => {
    const { container } = renderModal({ open: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el resumen dinámico con colaboradores seleccionados y fechas afectadas', () => {
    renderModal();

    expect(screen.getByText('Colaboradores seleccionados: 2')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-08-03' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-08-09' } });

    // Lun-Vie preseleccionados: 2026-08-03 (lun) a 2026-08-07 (vie) = 5 fechas
    expect(screen.getByText('Fechas afectadas: 5')).toBeInTheDocument();
  });

  it('valida que "hasta" no sea anterior a "desde"', () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-08-10' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-08-01' } });

    expect(
      screen.getByText('La fecha "hasta" debe ser mayor o igual a "desde"'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descargar plantilla' })).toBeDisabled();
  });

  it('valida que el rango no supere 90 días', () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-12-31' } });

    expect(screen.getByText('El rango de fechas no puede superar 90 días')).toBeInTheDocument();
  });

  it('valida que al menos un día de la semana esté seleccionado', () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-08-03' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-08-09' } });

    ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].forEach((label) => {
      fireEvent.click(screen.getByRole('checkbox', { name: label }));
    });

    expect(screen.getByText('Selecciona al menos un día de la semana')).toBeInTheDocument();
  });

  it('descarga la plantilla llamando al endpoint con los filtros correctos', async () => {
    getAssignmentTemplateMock.mockResolvedValue(new Blob(['xlsx']));
    renderModal();

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-08-03' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-08-09' } });

    fireEvent.click(screen.getByRole('button', { name: 'Descargar plantilla' }));

    await waitFor(() => {
      expect(getAssignmentTemplateMock).toHaveBeenCalledWith({
        from: '2026-08-03',
        to: '2026-08-09',
        weekdays: '1,2,3,4,5',
        employeeIds: 'emp-1,emp-2',
      });
    });
    await waitFor(() => {
      expect(downloadBlobMock).toHaveBeenCalled();
    });
  });

  it('rechaza un archivo con extensión inválida antes de llamar a la API', () => {
    renderModal();

    const file = new File(['contenido'], 'turnos.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('El archivo debe tener extensión .xlsx o .xls')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar' })).toBeDisabled();
  });

  it('rechaza un archivo que supera 5MB', () => {
    renderModal();

    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], 'turnos.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(screen.getByText('El archivo no puede superar 5 MB')).toBeInTheDocument();
  });

  it('importa el archivo y muestra el resumen', async () => {
    importAssignmentsMock.mockResolvedValue({
      totalRows: 2,
      totalAssignments: 2,
      createdOrUpdated: 1,
      returnedToBase: 0,
      restDays: 1,
      excluded: 0,
      errorCount: 0,
      errors: [],
    });
    renderModal();

    const file = new File(['contenido'], 'turnos.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));

    await waitFor(() => {
      expect(importAssignmentsMock).toHaveBeenCalledWith(file);
    });
    expect(await screen.findByText('Asignadas/actualizadas: 1')).toBeInTheDocument();
    expect(screen.getByText('Descansos: 1')).toBeInTheDocument();
  });

  it('muestra errores parciales de la importación', async () => {
    importAssignmentsMock.mockResolvedValue({
      totalRows: 2,
      totalAssignments: 1,
      createdOrUpdated: 1,
      returnedToBase: 0,
      restDays: 0,
      excluded: 0,
      errorCount: 1,
      errors: [{ row: 2, employee: '123', reason: 'Turno con sigla "XYZ" no encontrado' }],
    });
    renderModal();

    const file = new File(['contenido'], 'turnos.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));

    expect(
      await screen.findByText(/Fila 2 \(123\): Turno con sigla "XYZ" no encontrado/),
    ).toBeInTheDocument();
  });
});
