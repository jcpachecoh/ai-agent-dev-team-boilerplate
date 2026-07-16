import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { SenaQuotaPanel } from './SenaQuotaPanel';
import type { SenaQuotaResponse } from '../types/payroll-reports.types';

const getSenaQuotaMock = vi.fn();

vi.mock('../api/payroll.client', () => ({
  // Wrapper avoids TDZ on hoisted mock; matches PilaPeriodPanel.test pattern.
  getSenaQuota: (...args: unknown[]) => getSenaQuotaMock(...args) as Promise<SenaQuotaResponse>,
}));

function renderPanel(period = '2026-07'): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <SenaQuotaPanel period={period} />
    </MemoryRouter>,
  );
}

function buildResponse(overrides: Partial<SenaQuotaResponse> = {}): SenaQuotaResponse {
  return {
    period: '2026-07',
    eligibleWorkers: 15,
    requiredApprentices: 1,
    activeApprentices: 0,
    missingApprentices: 1,
    smlv: 1_750_905,
    monetizationRegime: 'LEY_2466_2025',
    estimatedMonetizationAmount: Math.round(1_750_905 * 1.5),
    status: 'PENDING',
    estimated: true,
    ...overrides,
  };
}

describe('SenaQuotaPanel (OS-599)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('llama al endpoint con el período seleccionado', async () => {
    getSenaQuotaMock.mockResolvedValue(buildResponse());

    renderPanel('2026-07');

    await waitFor(() => {
      expect(getSenaQuotaMock).toHaveBeenCalledWith('2026-07');
    });
    expect(await screen.findByText('Cumplimiento cuota SENA')).toBeInTheDocument();
    expect(screen.getByText('Estimación informativa')).toBeInTheDocument();
  });

  it('actualiza la consulta al cambiar el período', async () => {
    getSenaQuotaMock.mockResolvedValue(buildResponse());

    const { rerender } = renderPanel('2026-06');
    await waitFor(() => {
      expect(getSenaQuotaMock).toHaveBeenCalledWith('2026-06');
    });

    getSenaQuotaMock.mockResolvedValue(buildResponse({ period: '2026-07' }));
    rerender(
      <MemoryRouter>
        <SenaQuotaPanel period="2026-07" />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getSenaQuotaMock).toHaveBeenCalledWith('2026-07');
    });
  });

  it('muestra estado EXEMPT', async () => {
    getSenaQuotaMock.mockResolvedValue(
      buildResponse({
        eligibleWorkers: 10,
        requiredApprentices: 0,
        missingApprentices: 0,
        estimatedMonetizationAmount: 0,
        status: 'EXEMPT',
      }),
    );

    renderPanel();

    expect(await screen.findByText('Exento')).toBeInTheDocument();
    expect(screen.queryByText('Valor estimado a monetizar')).not.toBeInTheDocument();
  });

  it('muestra estado COMPLIANT', async () => {
    getSenaQuotaMock.mockResolvedValue(
      buildResponse({
        activeApprentices: 1,
        missingApprentices: 0,
        estimatedMonetizationAmount: 0,
        status: 'COMPLIANT',
      }),
    );

    renderPanel();

    expect(await screen.findByText('Cumple')).toBeInTheDocument();
    expect(screen.queryByText('Valor estimado a monetizar')).not.toBeInTheDocument();
  });

  it('muestra estado PENDING y monetización cuando es mayor que cero', async () => {
    getSenaQuotaMock.mockResolvedValue(buildResponse());

    renderPanel();

    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Valor estimado a monetizar')).toBeInTheDocument();
    expect(screen.getByText(/Régimen vigente desde junio de 2025/)).toBeInTheDocument();
    expect(screen.queryByText('LEY_2466_2025')).not.toBeInTheDocument();
    expect(screen.queryByText(/monetizationFactor/i)).not.toBeInTheDocument();
  });

  it('no destaca monetización cuando es cero', async () => {
    getSenaQuotaMock.mockResolvedValue(
      buildResponse({
        estimatedMonetizationAmount: 0,
        status: 'COMPLIANT',
        activeApprentices: 1,
        missingApprentices: 0,
      }),
    );

    renderPanel();

    await screen.findByText('Cumple');
    expect(screen.queryByText('Valor estimado a monetizar')).not.toBeInTheDocument();
    expect(screen.queryByText('$0')).not.toBeInTheDocument();
  });

  it('muestra disclaimer estimativo', async () => {
    getSenaQuotaMock.mockResolvedValue(buildResponse());

    renderPanel();

    expect(
      await screen.findByText(/no sustituye la cuota oficial determinada por el SENA/i),
    ).toBeInTheDocument();
  });

  it('muestra loading sin bloquear con error de otras secciones', async () => {
    let resolveQuota: ((value: SenaQuotaResponse) => void) | undefined;
    getSenaQuotaMock.mockImplementation(
      () =>
        new Promise<SenaQuotaResponse>((resolve) => {
          resolveQuota = resolve;
        }),
    );

    renderPanel();

    expect(screen.getByText(/Cargando estimación de cuota SENA/i)).toBeInTheDocument();

    resolveQuota?.(buildResponse());
    expect(await screen.findByText('Cumplimiento cuota SENA')).toBeInTheDocument();
  });

  it('error aislado con reintento', async () => {
    getSenaQuotaMock.mockRejectedValueOnce(new Error('network')).mockResolvedValue(buildResponse());

    renderPanel();

    expect(
      await screen.findByText(/No se pudo cargar la estimación de cuota SENA/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Cumplimiento cuota SENA')).toBeInTheDocument();
    expect(getSenaQuotaMock).toHaveBeenCalledTimes(2);
  });

  it('muestra métricas de trabajadores y aprendices', async () => {
    getSenaQuotaMock.mockResolvedValue(buildResponse());

    renderPanel();

    expect(await screen.findByText('Trabajadores computables')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Aprendices requeridos')).toBeInTheDocument();
    expect(screen.getByText('Aprendices activos')).toBeInTheDocument();
    expect(screen.getByText('Aprendices faltantes')).toBeInTheDocument();
  });
});
