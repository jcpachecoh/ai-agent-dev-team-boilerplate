import { render, screen, waitFor } from '@testing-library/react';
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
  reportIncident: vi.fn(),
}));

vi.mock('@/stores/session.store', () => ({
  useSessionStore: vi.fn((selector: (state: { operator: { locationId: string } }) => unknown) =>
    selector({ operator: { locationId: 'loc-1' } }),
  ),
}));

import { IncidentPhotoError, takeIncidentPhoto } from '@/services/camera.service';
import { reportIncident } from '@/services/incident.service';

import { IncidentReportModal } from './IncidentReportModal';

const defaultProps = {
  open: true,
  workStationId: 'ws-1',
  orderId: 'order-1',
  onClose: vi.fn(),
};

describe('IncidentReportModal — cámara', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reportIncident).mockResolvedValue({ queued: false, hasPhoto: false });
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

  it('informa cola offline cuando hay foto y no hay conexión', async () => {
    const user = userEvent.setup();
    vi.mocked(takeIncidentPhoto).mockResolvedValue('data:image/jpeg;base64,preview');
    vi.mocked(reportIncident).mockResolvedValue({ queued: true, hasPhoto: true });

    render(<IncidentReportModal {...defaultProps} onSubmitted={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText('Describe la novedad en la estación...'),
      'Falla en sensor',
    );
    await user.click(screen.getByRole('button', { name: 'Tomar foto' }));
    await screen.findByAltText('Vista previa del incidente');
    await user.click(screen.getByRole('button', { name: 'Reportar' }));

    expect(await screen.findByText(/Incidente en cola offline/i)).toBeTruthy();
    expect(reportIncident).toHaveBeenCalledWith(
      expect.objectContaining({ workStationId: 'ws-1', description: 'Falla en sensor' }),
      'data:image/jpeg;base64,preview',
    );
  });
});
