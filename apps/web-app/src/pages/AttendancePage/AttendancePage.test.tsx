import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import AttendancePage from './AttendancePage';

vi.mock('@/features/attendance', () => ({
  AttendanceCollaboratorsScreen: () => <div>Colaboradores asistencia</div>,
  AttendanceMonitorScreen: () => <div>Monitor de asistencias</div>,
  AttendanceLocationDetailScreen: () => <div>Detalle sede</div>,
  AttendanceCardScreen: () => <div>Tarjeta colaborador</div>,
}));

describe('AttendancePage', () => {
  it('renders panel placeholder on index route', async () => {
    render(
      <MemoryRouter initialEntries={['/asistencia']}>
        <Routes>
          <Route path="/asistencia/*" element={<AttendancePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Panel de control' })).toBeInTheDocument();
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument();
  });

  it('renders colaboradores section route', async () => {
    render(
      <MemoryRouter initialEntries={['/asistencia/colaboradores']}>
        <Routes>
          <Route path="/asistencia/*" element={<AttendancePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Colaboradores asistencia')).toBeInTheDocument();
  });

  it('renders asistencias section route', async () => {
    render(
      <MemoryRouter initialEntries={['/asistencia/asistencias']}>
        <Routes>
          <Route path="/asistencia/*" element={<AttendancePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Monitor de asistencias')).toBeInTheDocument();
  });
});
