import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { PilaPeriodPanel } from './PilaPeriodPanel';
import type { PilaPeriodExport, PilaValidationResponse } from '../types/pila.types';

const listPilaExportsMock = vi.fn();
const validatePilaPeriodMock = vi.fn();
const getPilaDeadlineMock = vi.fn();
const generatePilaExportMock = vi.fn();
const downloadPilaExportMock = vi.fn();
const downloadPilaAnexo2ReviewXlsxMock = vi.fn();
const markPilaExportPaidMock = vi.fn();
const voidPilaExportMock = vi.fn();

vi.mock('../api/pila.client', () => ({
  listPilaExports: (...args: unknown[]) => listPilaExportsMock(...args),
  validatePilaPeriod: (...args: unknown[]) => validatePilaPeriodMock(...args),
  getPilaDeadline: (...args: unknown[]) => getPilaDeadlineMock(...args),
  generatePilaExport: (...args: unknown[]) => generatePilaExportMock(...args),
  downloadPilaExport: (...args: unknown[]) => downloadPilaExportMock(...args),
  downloadPilaAnexo2ReviewXlsx: (...args: unknown[]) => downloadPilaAnexo2ReviewXlsxMock(...args),
  markPilaExportPaid: (...args: unknown[]) => markPilaExportPaidMock(...args),
  voidPilaExport: (...args: unknown[]) => voidPilaExportMock(...args),
}));

function renderPanel(period = '2026-07'): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <PilaPeriodPanel period={period} />
    </MemoryRouter>,
  );
}

const downloadExportBlobMock = vi.fn();

vi.mock('../utils/download-export-blob', () => ({
  downloadExportBlob: (...args: unknown[]) => downloadExportBlobMock(...args),
}));

const useMeMock = vi.fn();

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: () => useMeMock(),
}));

vi.mock('@/lib/auth-token', () => ({
  getRoleCodeFromToken: () => null,
}));

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const toastWarningMock = vi.fn();

vi.mock('@restopsiq/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@restopsiq/ui')>();
  return {
    ...actual,
    toast: {
      ...actual.toast,
      success: (...args: unknown[]) => toastSuccessMock(...args),
      error: (...args: unknown[]) => toastErrorMock(...args),
      warning: (...args: unknown[]) => toastWarningMock(...args),
    },
  };
});

function buildExport(overrides: Partial<PilaPeriodExport> = {}): PilaPeriodExport {
  return {
    id: 'exp-1',
    tenantId: 't1',
    periodHealth: '2026-07',
    periodOther: '2026-06',
    format: 'TXT',
    status: 'GENERATED',
    version: 1,
    technicalVersion: 'anexo2-v29',
    fileName: 'pila-E-900000000-2026-07-v1.txt',
    fileChecksum: 'abc',
    employeeCount: 1,
    totalPayrollAmount: 1_500_000,
    totalContribution: 400_000,
    storageObjectId: 'sto-1',
    generatedAt: '2026-07-15T12:00:00.000Z',
    generatedBy: 'user-1',
    paidAt: null,
    paidConfirmedBy: null,
    planNumber: null,
    paymentReference: null,
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    createdAt: '2026-07-15T12:00:00.000Z',
    updatedAt: '2026-07-15T12:00:00.000Z',
    ...overrides,
  };
}

const okValidation: PilaValidationResponse = {
  ok: true,
  errors: [],
  summary: { employeeCount: 1 },
};

const failedValidation: PilaValidationResponse = {
  ok: false,
  errors: [
    {
      code: 'EMPLOYEE_EPS_PILA_CODE_MISSING',
      field: 'epsCode',
      message: 'Falta código EPS',
      employeeId: 'e1',
      employeeName: 'Ana Pérez',
    },
  ],
  summary: null,
};

describe('PilaPeriodPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMeMock.mockReturnValue({ data: { roleCode: 'OWNER' } });
    listPilaExportsMock.mockResolvedValue([]);
    validatePilaPeriodMock.mockResolvedValue(okValidation);
    getPilaDeadlineMock.mockResolvedValue({
      period: '2026-07',
      paymentMonth: '2026-08',
      dueDate: '2026-08-04',
      businessDayNumber: 2,
      lastTwoNitDigits: '00',
      daysRemaining: 30,
      status: 'NOT_DUE',
      shouldAlert: false,
      timezone: 'America/Bogota',
    });
    generatePilaExportMock.mockResolvedValue(buildExport());
    downloadPilaExportMock.mockResolvedValue({
      blob: new Blob(['PILA']),
      filename: 'pila.txt',
    });
    downloadPilaAnexo2ReviewXlsxMock.mockResolvedValue({
      blob: new Blob(['xlsx']),
      filename: 'pila-anexo2-revision.xlsx',
    });
    markPilaExportPaidMock.mockResolvedValue(buildExport({ status: 'PAID' }));
    voidPilaExportMock.mockResolvedValue(buildExport({ status: 'VOIDED' }));
  });

  it('muestra estado pendiente sin exportaciones', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('Pendiente')).toBeInTheDocument());
    expect(screen.getByText(/Aún no hay una exportación generada/i)).toBeInTheDocument();
  });

  it('muestra errores de validación accionables', async () => {
    validatePilaPeriodMock.mockResolvedValue(failedValidation);
    renderPanel();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Validar PILA' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Validar PILA' }));

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeInTheDocument());
    expect(screen.getByText('Falta código EPS')).toBeInTheDocument();
    expect(screen.queryByText('EMPLOYEE_EPS_PILA_CODE_MISSING')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generar Archivo plano TXT/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Generar Plantilla XLSX/i })).toBeDisabled();
  });

  it('genera TXT y refresca historial', async () => {
    listPilaExportsMock.mockResolvedValueOnce([]).mockResolvedValueOnce([buildExport()]);

    renderPanel();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Generar Archivo plano TXT/i })).toBeEnabled(),
    );

    fireEvent.click(screen.getByRole('button', { name: /Generar Archivo plano TXT/i }));

    await waitFor(() => expect(generatePilaExportMock).toHaveBeenCalledWith('2026-07', 'TXT'));
    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Historial de versiones')).toBeInTheDocument());
  });

  it('genera XLSX de forma independiente', async () => {
    generatePilaExportMock.mockResolvedValue(
      buildExport({ id: 'exp-xlsx', format: 'XLSX', fileName: 'pila.xlsx' }),
    );
    listPilaExportsMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        buildExport({ id: 'exp-xlsx', format: 'XLSX', fileName: 'pila.xlsx' }),
      ]);

    renderPanel();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Generar Plantilla XLSX/i })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Generar Plantilla XLSX/i }));

    await waitFor(() => expect(generatePilaExportMock).toHaveBeenCalledWith('2026-07', 'XLSX'));
  });

  it('explica lotes XLSX cuando hay más de 20 empleados', async () => {
    validatePilaPeriodMock.mockResolvedValue({
      ...okValidation,
      summary: { employeeCount: 21, xlsxSupported: true, xlsxBatchCount: 2 },
    });
    renderPanel();
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/2 archivos de hasta 20/i),
    );
    const xlsxBtn = screen.getByRole('button', { name: /Generar XLSX \(2 lotes ZIP\)/i });
    expect(xlsxBtn).toBeEnabled();
    expect(xlsxBtn).toHaveAttribute('aria-describedby', 'pila-xlsx-batch-info');
    expect(screen.getByRole('button', { name: /Generar Archivo plano TXT/i })).toBeEnabled();
  });

  it('descarga TXT activo con fileName del listado', async () => {
    const row = buildExport();
    listPilaExportsMock.mockResolvedValue([row]);
    downloadPilaExportMock.mockResolvedValue({
      blob: new Blob(['txt'], { type: 'text/plain' }),
      filename: 'fallback-from-headers.txt',
    });
    renderPanel();

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Descargar Archivo plano TXT/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Descargar Archivo plano TXT/i }));

    await waitFor(() => expect(downloadPilaExportMock).toHaveBeenCalledWith('exp-1'));
    expect(downloadExportBlobMock).toHaveBeenCalledWith(
      expect.any(Blob),
      'pila-E-900000000-2026-07-v1.txt',
    );
  });

  it('descarga Excel de revisión Anexo 2 desde export TXT', async () => {
    listPilaExportsMock.mockResolvedValue([buildExport()]);
    renderPanel();

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Descargar Anexo 2 \(Excel\)/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Descargar Anexo 2 \(Excel\)/i }));

    await waitFor(() => expect(downloadPilaAnexo2ReviewXlsxMock).toHaveBeenCalledWith('exp-1'));
    expect(downloadExportBlobMock).toHaveBeenCalledWith(
      expect.any(Blob),
      'pila-anexo2-revision.xlsx',
    );
  });

  it('muestra ambos formatos en historial', async () => {
    listPilaExportsMock.mockResolvedValue([
      buildExport({ id: 'exp-txt', format: 'TXT' }),
      buildExport({
        id: 'exp-xlsx',
        format: 'XLSX',
        fileName: 'pila.xlsx',
        version: 1,
      }),
    ]);
    renderPanel();

    await waitFor(() => expect(screen.getByText('TXT')).toBeInTheDocument());
    expect(screen.getByText('XLSX')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Descargar Plantilla XLSX/i })).toBeInTheDocument();
  });

  it('oculta acciones de escritura para rol NOMINA', async () => {
    useMeMock.mockReturnValue({ data: { roleCode: 'NOMINA' } });
    listPilaExportsMock.mockResolvedValue([buildExport()]);

    renderPanel();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Descargar Archivo plano TXT/i }),
      ).toBeInTheDocument(),
    );

    expect(
      screen.queryByRole('button', { name: /Generar Archivo plano TXT/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Generar Plantilla XLSX/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Marcar pagado' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Anular' })).not.toBeInTheDocument();
  });

  it('muestra error de backend al generar', async () => {
    const { PayrollApiError } = await import('../api/payroll.client');
    generatePilaExportMock.mockRejectedValue(new PayrollApiError('conflicto de versión', 409));

    renderPanel();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Generar Archivo plano TXT/i })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Generar Archivo plano TXT/i }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith('conflicto de versión'));
  });
});
