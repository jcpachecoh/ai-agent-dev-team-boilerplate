import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/camera.service', () => ({
  takeIncidentPhoto: vi.fn(),
  IncidentPhotoError: class IncidentPhotoError extends Error {
    constructor(
      public readonly code: 'permission_denied' | 'cancelled' | 'unavailable',
      message: string,
    ) {
      super(message);
      this.name = 'IncidentPhotoError';
    }
  },
}));

vi.mock('@/services/incident.service', () => ({
  reportOrderNovelty: vi.fn(),
}));

vi.mock('@/stores/session.store', () => ({
  useSessionStore: vi.fn((selector: (state: { operator: { locationId: string } }) => unknown) =>
    selector({ operator: { locationId: 'loc-1' } }),
  ),
}));

import { IncidentPhotoError, takeIncidentPhoto } from '@/services/camera.service';
import { reportOrderNovelty } from '@/services/incident.service';

import { IncidentReportModal } from './IncidentReportModal';

const defaultProps = {
  open: true,
  workStationId: 'ws-1',
  orderId: 'order-1',
  executionId: 'exec-1',
  onClose: vi.fn(),
};

describe('IncidentReportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reportOrderNovelty).mockResolvedValue({ queued: false, hasPhoto: false });
  });

  it('muestra preview tras capturar foto', async () => {
    const user = userEvent.setup();
    vi.mocked(takeIncidentPhoto).mockResolvedValue('data:image/jpeg;base64,preview');

    render(<IncidentReportModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Tomar foto' }));

    expect(await screen.findByAltText('Vista previa del incidente')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cambiar foto' })).toBeTruthy();
  });

  it('muestra error cuando el permiso de cámara es denegado', async () => {
    const user = userEvent.setup();
    vi.mocked(takeIncidentPhoto).mockRejectedValue(
      new IncidentPhotoError('permission_denied', 'Permiso de cámara denegado'),
    );

    render(<IncidentReportModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Tomar foto' }));

    expect(await screen.findByText('Permiso de cámara denegado')).toBeTruthy();
    expect(screen.queryByAltText('Vista previa del incidente')).toBeNull();
  });

  it('no muestra error si el usuario cancela la captura', async () => {
    const user = userEvent.setup();
    vi.mocked(takeIncidentPhoto).mockRejectedValue(
      new IncidentPhotoError('cancelled', 'Captura cancelada'),
    );

    render(<IncidentReportModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Tomar foto' }));

    await waitFor(() => {
      expect(screen.queryByText('Captura cancelada')).toBeNull();
    });
    expect(screen.queryByAltText('Vista previa del incidente')).toBeNull();
  });

  it('envía novedad con tipo, gravedad y pausa seleccionados', async () => {
    const user = userEvent.setup();

    render(<IncidentReportModal {...defaultProps} onSubmitted={vi.fn()} />);

    const typeGroup = screen.getByRole('radiogroup', { name: 'Tipo de novedad' });
    const severityGroup = screen.getByRole('radiogroup', { name: 'Gravedad' });

    await user.click(within(typeGroup).getByRole('radio', { name: /Falla de equipo/i }));
    await user.click(within(severityGroup).getByRole('radio', { name: /^Alta$/i }));
    await user.click(screen.getByLabelText('¿Requiere pausa de la orden?'));
    await user.type(
      screen.getByPlaceholderText('Describe la novedad en la estación...'),
      'Falla en sensor',
    );
    await user.click(screen.getByRole('button', { name: 'REGISTRAR NOVEDAD' }));

    expect(reportOrderNovelty).toHaveBeenCalledWith(
      'order-1',
      expect.objectContaining({
        workStationId: 'ws-1',
        noveltyType: 'EQUIPMENT_FAILURE',
        severity: 'HIGH',
        requiresPause: true,
        description: 'Falla en sensor',
        stepId: 'exec-1',
        locationId: 'loc-1',
      }),
      undefined,
    );
  });

  it('informa cola offline cuando hay foto y no hay conexión', async () => {
    const user = userEvent.setup();
    vi.mocked(takeIncidentPhoto).mockResolvedValue('data:image/jpeg;base64,preview');
    vi.mocked(reportOrderNovelty).mockResolvedValue({ queued: true, hasPhoto: true });

    render(<IncidentReportModal {...defaultProps} onSubmitted={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText('Describe la novedad en la estación...'),
      'Falla en sensor',
    );
    await user.click(screen.getByRole('button', { name: 'Tomar foto' }));
    await screen.findByAltText('Vista previa del incidente');
    await user.click(screen.getByRole('button', { name: 'REGISTRAR NOVEDAD' }));

    expect(await screen.findByText(/Novedad en cola offline/i)).toBeTruthy();
    expect(reportOrderNovelty).toHaveBeenCalledWith(
      'order-1',
      expect.objectContaining({ description: 'Falla en sensor' }),
      'data:image/jpeg;base64,preview',
    );
  });
});
