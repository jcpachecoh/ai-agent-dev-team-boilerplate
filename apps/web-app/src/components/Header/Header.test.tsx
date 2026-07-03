import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { ThemeProvider } from '@/providers/ThemeProvider';

import Header from './Header';

vi.mock('@/features/empresa/hooks/useTenant', () => ({
  useTenant: () => ({
    data: {
      name: 'Inversiones Llanes',
      tradeName: 'INVERSIONES LLANES S.A.S',
    },
  }),
}));

describe('Header', () => {
  it('renders clock, theme switch and user menu', () => {
    render(
      <ThemeProvider initialTheme="dark">
        <MemoryRouter initialEntries={['/recetas']}>
          <Header />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(screen.getByLabelText(/cambiar tema claro u oscuro/i)).toBeInTheDocument();
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/clasificación de mano de obra/i)).not.toBeInTheDocument();
  });

  it('renders labor classification filter on asistencia routes', () => {
    render(
      <ThemeProvider initialTheme="light">
        <MemoryRouter initialEntries={['/asistencia/colaboradores']}>
          <Header />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(screen.getByLabelText(/clasificación de mano de obra/i)).toBeInTheDocument();
    expect(screen.getByText('INVERSIONES LLANES S.A.S - Todos')).toBeInTheDocument();
  });

  it('calls onMenuClick when menu button is clicked', async () => {
    const user = userEvent.setup();
    const onMenuClick = vi.fn();

    render(
      <ThemeProvider initialTheme="dark">
        <MemoryRouter>
          <Header showMenuButton onMenuClick={onMenuClick} />
        </MemoryRouter>
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: /abrir menú/i }));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });
});
