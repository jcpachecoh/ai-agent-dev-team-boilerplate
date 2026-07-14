import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { CesantiasScreen } from './CesantiasScreen';
import type { CesantiasExportResult, CesantiasListResponse } from '../types/cesantias.types';

const listCesantiasMock = vi.fn();
const calculateCesantiasMock = vi.fn();
const getCesantiasAlertSummaryMock = vi.fn();
const exportCesantiasMock = vi.fn();
const getCesantiasExportAvailabilityMock = vi.fn();

vi.mock('../api/cesantias.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/cesantias.client')>();
  return {
    ...actual,
    listCesantias: (...args: unknown[]) => listCesantiasMock(...args),
    calculateCesantias: (...args: unknown[]) => calculateCesantiasMock(...args),
    getCesantiasAlertSummary: (...args: unknown[]) => getCesantiasAlertSummaryMock(...args),
    exportCesantias: (...args: unknown[]) => exportCesantiasMock(...args),
    getCesantiasExportAvailability: (...args: unknown[]) =>
      getCesantiasExportAvailabilityMock(...args),
  };
});

const listEmployeeCatalogOptionsMock = vi.fn();

vi.mock('../api/payroll.client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/payroll.client')>();
  return {
    ...actual,
    listEmployeeCatalogOptions: (...args: unknown[]) => listEmployeeCatalogOptionsMock(...args),
  };
});

const downloadExportBlobMock = vi.fn();

vi.mock('../utils/download-export-blob', () => ({
  downloadExportBlob: (...args: unknown[]) => downloadExportBlobMock(...args),
}));

const useMeMock = vi.fn();

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: () => useMeMock(),
}));

// sonner's <Toaster> no está montado en el árbol de test (AllProviders no lo incluye,
// solo la app real vía ThemedToaster) — se mockea `toast` para poder verificar las
// llamadas en vez de buscar el contenido en el DOM.
const toastWarningMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('@restopsiq/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@restopsiq/ui')>();
  return {
    ...actual,
    toast: {
      ...actual.toast,
      warning: (...args: unknown[]) => toastWarningMock(...args),
      success: (...args: unknown[]) => toastSuccessMock(...args),
      error: (...args: unknown[]) => toastErrorMock(...args),
    },
  };
});

function buildLiquidation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'liq-1',
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    employeeName: 'Ana Gómez',
    year: 2026,
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    accrualDays: 360,
    calculationBase: '1500000.00',
    cesantiasAmount: '1500000.00',
    interestAmount: '180000.00',
    interestRateSnapshot: '0.12',
    fundNameSnapshot: 'Fondo Nacional del Ahorro',
    fundChannelSnapshot: 'FNA',
    cesantiasStatus: 'CALCULADA',
    interestStatus: 'CALCULADO',
    calculatedBy: 'user-1',
    calculatedAt: '2026-01-15T00:00:00.000Z',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

function buildListResponse(overrides: Partial<CesantiasListResponse> = {}): CesantiasListResponse {
  return {
    items: [buildLiquidation()],
    total: 1,
    limit: 50,
    offset: 0,
    ...overrides,
  };
}

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={['/payroll/cesantias']}>
      <Routes>
        <Route path="/payroll/cesantias" element={<CesantiasScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CesantiasScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMeMock.mockReturnValue({ data: { roleCode: 'OWNER', email: 'owner@restopsiq.dev' } });
    listEmployeeCatalogOptionsMock.mockResolvedValue([
      { id: 'cat-1', type: 'CESANTIAS_FUND', name: 'Fondo Nacional del Ahorro' },
      { id: 'cat-2', type: 'CESANTIAS_FUND', name: 'Porvenir' },
    ]);
    getCesantiasAlertSummaryMock.mockResolvedValue({
      targetYear: 2025,
      deadlineDate: '2026-02-14',
      pendingCount: 0,
      daysUntilDeadline: 30,
      status: 'COMPLETADA',
    });
    listCesantiasMock.mockResolvedValue(buildListResponse());
    getCesantiasExportAvailabilityMock.mockResolvedValue({ fna: true, privateOperator: true });
  });

  describe('carga y filtros', () => {
    it('carga liquidaciones del año actual por defecto y las muestra sin exponer employeeId', async () => {
      renderScreen();

      await waitFor(() => expect(screen.getByText('Ana Gómez')).toBeInTheDocument());

      expect(screen.queryByText('emp-1')).not.toBeInTheDocument();
      const currentYear = new Date().getFullYear();
      expect(listCesantiasMock).toHaveBeenCalledWith(
        expect.objectContaining({ year: currentYear }),
      );
    });

    it('muestra el estado de carga y luego reemplaza por los resultados', async () => {
      renderScreen();
      await waitFor(() => expect(screen.getByText('Ana Gómez')).toBeInTheDocument());
    });

    it('muestra el empty state cuando no hay liquidaciones para los filtros', async () => {
      listCesantiasMock.mockResolvedValue(buildListResponse({ items: [], total: 0 }));

      renderScreen();

      await waitFor(() =>
        expect(
          screen.getByText('No hay liquidaciones de cesantías para los filtros seleccionados.'),
        ).toBeInTheDocument(),
      );
    });

    it('muestra el estado de error con opción de reintentar', async () => {
      listCesantiasMock.mockRejectedValue(new Error('network error'));

      renderScreen();

      await waitFor(() =>
        expect(
          screen.getByText('No se pudo cargar el listado de liquidaciones.'),
        ).toBeInTheDocument(),
      );
    });

    it('los intereses se muestran en una columna separada de las cesantías', async () => {
      listCesantiasMock.mockResolvedValue(
        buildListResponse({
          items: [
            buildLiquidation({
              calculationBase: '1400000.00',
              cesantiasAmount: '1500000.00',
              interestAmount: '180000.00',
            }),
          ],
        }),
      );

      renderScreen();

      await waitFor(() => expect(screen.getByText('Ana Gómez')).toBeInTheDocument());

      const row = screen.getByText('Ana Gómez').closest('tr');
      expect(row).not.toBeNull();
      const cesantiasCell = within(row as HTMLElement).getByText(/\$\s?1[.,]500[.,]000/);
      const interestCell = within(row as HTMLElement).getByText(/\$\s?180[.,]000/);
      expect(cesantiasCell).not.toBe(interestCell);
    });
  });

  describe('cálculo anual', () => {
    it('SUPERVISOR/OWNER: ejecuta el cálculo sin confirmación cuando no existen liquidaciones previas para el año', async () => {
      listCesantiasMock.mockResolvedValue(buildListResponse({ items: [], total: 0 }));
      calculateCesantiasMock.mockResolvedValue({
        tenantId: 'tenant-1',
        year: new Date().getFullYear(),
        totalEmployeesEvaluated: 5,
        created: 5,
        updated: 0,
        skipped: [],
        liquidations: [],
      });
      const confirmSpy = vi.spyOn(window, 'confirm');

      renderScreen();

      const calcButton = await screen.findByRole('button', { name: /Ejecutar cálculo anual/ });
      fireEvent.click(calcButton);

      await waitFor(() => expect(calculateCesantiasMock).toHaveBeenCalled());
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('pide confirmación antes de recalcular si ya existen liquidaciones para el año, y respeta la cancelación', async () => {
      calculateCesantiasMock.mockResolvedValue({
        tenantId: 'tenant-1',
        year: 2026,
        totalEmployeesEvaluated: 5,
        created: 0,
        updated: 5,
        skipped: [],
        liquidations: [],
      });
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderScreen();

      const calcButton = await screen.findByRole('button', { name: /Ejecutar cálculo anual/ });
      // Espera a que se resuelva la consulta auxiliar que determina si ya existen
      // liquidaciones para el año (de lo contrario el click puede llegar antes de que
      // `hasExistingForYear` refleje los datos y el flujo se saltaría la confirmación).
      // listCesantias se usa dos veces (tabla principal + consulta auxiliar
      // "¿existe algo para este año?"); la disponibilidad de exportación por canal ahora
      // viene de un endpoint aparte (getCesantiasExportAvailability).
      await waitFor(() => expect(listCesantiasMock).toHaveBeenCalledTimes(2));
      fireEvent.click(calcButton);

      await waitFor(() => expect(window.confirm).toHaveBeenCalled());
      expect(calculateCesantiasMock).not.toHaveBeenCalled();
    });

    it('confirmando el recálculo sí invoca calculateCesantias', async () => {
      calculateCesantiasMock.mockResolvedValue({
        tenantId: 'tenant-1',
        year: 2026,
        totalEmployeesEvaluated: 5,
        created: 0,
        updated: 5,
        skipped: [],
        liquidations: [],
      });
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderScreen();

      const calcButton = await screen.findByRole('button', { name: /Ejecutar cálculo anual/ });
      // listCesantias se usa dos veces (tabla principal + consulta auxiliar
      // "¿existe algo para este año?"); la disponibilidad de exportación por canal ahora
      // viene de un endpoint aparte (getCesantiasExportAvailability).
      await waitFor(() => expect(listCesantiasMock).toHaveBeenCalledTimes(2));
      fireEvent.click(calcButton);

      await waitFor(() => expect(calculateCesantiasMock).toHaveBeenCalled());
    });
  });

  describe('descarga FNA y privada', () => {
    it('descarga FNA llama a exportCesantias con el canal y año correctos, y dispara la descarga', async () => {
      const result: CesantiasExportResult = {
        blob: new Blob(['data']),
        filename: 'cesantias-fna-2026.xlsx',
        skippedCount: 0,
      };
      exportCesantiasMock.mockResolvedValue(result);

      renderScreen();

      const fnaButton = await screen.findByRole('button', { name: /Descargar FNA/ });
      await waitFor(() => expect(fnaButton).not.toBeDisabled());
      fireEvent.click(fnaButton);

      await waitFor(() =>
        expect(exportCesantiasMock).toHaveBeenCalledWith('fna', new Date().getFullYear()),
      );
      expect(downloadExportBlobMock).toHaveBeenCalledWith(result.blob, result.filename);
    });

    it('descarga fondos privados llama a exportCesantias con el canal correcto', async () => {
      exportCesantiasMock.mockResolvedValue({
        blob: new Blob(['data']),
        filename: 'cesantias-fondos-privados-2026.xlsx',
        skippedCount: 0,
      });

      renderScreen();

      const privateButton = await screen.findByRole('button', {
        name: /Descargar fondos privados/,
      });
      await waitFor(() => expect(privateButton).not.toBeDisabled());
      fireEvent.click(privateButton);

      await waitFor(() =>
        expect(exportCesantiasMock).toHaveBeenCalledWith('private-funds', new Date().getFullYear()),
      );
    });

    it('el botón FNA está deshabilitado cuando no hay registros exportables de ese canal para el año', async () => {
      getCesantiasExportAvailabilityMock.mockResolvedValue({
        fna: false,
        privateOperator: true,
      });

      renderScreen();

      const fnaButton = await screen.findByRole('button', { name: /Descargar FNA/ });
      await waitFor(() => expect(fnaButton).toBeDisabled());
    });

    it('botones con solo liquidaciones no exportables (p.ej. todas ANULADA): ambos deshabilitados aunque la tabla muestre filas', async () => {
      // La tabla SÍ puede mostrar liquidaciones (p.ej. filtrando por estado ANULADA) —
      // eso es independiente de si son exportables. La habilitación de los botones nunca
      // debe depender de si `items`/`total` tienen contenido, solo de
      // getCesantiasExportAvailability (ver CesantiasService.getExportAvailability,
      // que excluye ANULADA por diseño).
      listCesantiasMock.mockResolvedValue(
        buildListResponse({
          items: [buildLiquidation({ cesantiasStatus: 'ANULADA' })],
          total: 1,
        }),
      );
      getCesantiasExportAvailabilityMock.mockResolvedValue({
        fna: false,
        privateOperator: false,
      });

      renderScreen();

      await waitFor(() => expect(screen.getByText('Ana Gómez')).toBeInTheDocument());

      const fnaButton = screen.getByRole('button', { name: /Descargar FNA/ });
      const privateButton = screen.getByRole('button', { name: /Descargar fondos privados/ });
      await waitFor(() => expect(fnaButton).toBeDisabled());
      expect(privateButton).toBeDisabled();
    });

    it('exportar nunca invoca calculateCesantias ni ninguna mutación de estado', async () => {
      exportCesantiasMock.mockResolvedValue({
        blob: new Blob(['data']),
        filename: 'cesantias-fna-2026.xlsx',
        skippedCount: 0,
      });

      renderScreen();

      const fnaButton = await screen.findByRole('button', { name: /Descargar FNA/ });
      await waitFor(() => expect(fnaButton).not.toBeDisabled());
      fireEvent.click(fnaButton);

      await waitFor(() => expect(exportCesantiasMock).toHaveBeenCalled());
      expect(calculateCesantiasMock).not.toHaveBeenCalled();
    });
  });

  describe('advertencia por registros omitidos', () => {
    it('muestra una advertencia (toast) cuando el header de omitidos reporta > 0', async () => {
      exportCesantiasMock.mockResolvedValue({
        blob: new Blob(['data']),
        filename: 'cesantias-fna-2026.xlsx',
        skippedCount: 2,
      });

      renderScreen();

      const fnaButton = await screen.findByRole('button', { name: /Descargar FNA/ });
      await waitFor(() => expect(fnaButton).not.toBeDisabled());
      fireEvent.click(fnaButton);

      await waitFor(() =>
        expect(toastWarningMock).toHaveBeenCalledWith(
          expect.stringMatching(/2 liquidaciones no se incluyeron en el archivo/),
        ),
      );
    });

    it('no muestra advertencia cuando skippedCount es 0', async () => {
      exportCesantiasMock.mockResolvedValue({
        blob: new Blob(['data']),
        filename: 'cesantias-fna-2026.xlsx',
        skippedCount: 0,
      });

      renderScreen();

      const fnaButton = await screen.findByRole('button', { name: /Descargar FNA/ });
      await waitFor(() => expect(fnaButton).not.toBeDisabled());
      fireEvent.click(fnaButton);

      await waitFor(() => expect(exportCesantiasMock).toHaveBeenCalled());
      expect(toastWarningMock).not.toHaveBeenCalled();
    });
  });

  describe('permisos', () => {
    it('NOMINA (rol de solo lectura): no muestra el botón de cálculo ni los de exportación', async () => {
      useMeMock.mockReturnValue({ data: { roleCode: 'NOMINA', email: 'nomina@restopsiq.dev' } });

      renderScreen();

      await waitFor(() => expect(screen.getByText('Ana Gómez')).toBeInTheDocument());

      expect(
        screen.queryByRole('button', { name: /Ejecutar cálculo anual/ }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Descargar FNA/ })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Descargar fondos privados/ }),
      ).not.toBeInTheDocument();
    });

    it('SUPERVISOR: sí ve el botón de cálculo y los de exportación', async () => {
      useMeMock.mockReturnValue({ data: { roleCode: 'SUPERVISOR', email: 'sup@restopsiq.dev' } });

      renderScreen();

      await waitFor(() => expect(screen.getByText('Ana Gómez')).toBeInTheDocument());

      expect(screen.getByRole('button', { name: /Ejecutar cálculo anual/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Descargar FNA/ })).toBeInTheDocument();
    });
  });
});
