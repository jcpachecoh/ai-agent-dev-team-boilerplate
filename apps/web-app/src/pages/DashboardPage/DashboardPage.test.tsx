import { render, screen } from '@testing-library/react';

import DashboardPage from './DashboardPage';

describe('DashboardPage', () => {
  it('renders dashboard hero and KPI cards', () => {
    render(<DashboardPage />);

    expect(screen.getByRole('heading', { name: /restopsiq plant/i })).toBeInTheDocument();
    expect(screen.getByText('Estaciones Activas')).toBeInTheDocument();
    expect(screen.getByText('5/6')).toBeInTheDocument();
    expect(screen.getByText('Recetas Activas')).toBeInTheDocument();
  });
});
