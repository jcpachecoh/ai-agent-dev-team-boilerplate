import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { ThemeProvider } from '@/providers/ThemeProvider';

import Header from './Header';

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
    expect(screen.getByText('Carlos Mendez')).toBeInTheDocument();
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
