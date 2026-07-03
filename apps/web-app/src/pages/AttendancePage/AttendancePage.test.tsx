import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import AttendancePage from './AttendancePage';

vi.mock('@/features/attendance', () => ({
  AttendanceDashboardScreen: () => <div>Panel de control</div>,
  AttendanceCollaboratorsScreen: () => <div>Colaboradores asistencia</div>,
  AttendanceMonitorScreen: () => <div>Monitor de asistencias</div>,
  AttendanceLocationDetailScreen: () => <div>Detalle sede</div>,
  AttendanceCardScreen: () => <div>Tarjeta colaborador</div>,
  TurnosListScreen: () => <div>Detalle de turnos</div>,
  AsignacionTurnosScreen: () => <div>Asignación de turnos</div>,
}));

describe('AttendancePage', () => {
  it('renders dashboard screen on index route', async () => {
    render(
      <MemoryRouter initialEntries={['/asistencia']}>
        <Routes>
          <Route path="/asistencia/*" element={<AttendancePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Panel de control')).toBeInTheDocument();
  });

  it('renders asignación de turnos on turnos/asignacion route', async () => {
    render(
      <MemoryRouter initialEntries={['/asistencia/turnos/asignacion']}>
        <Routes>
          <Route path="/asistencia/*" element={<AttendancePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Asignación de turnos')).toBeInTheDocument();
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
