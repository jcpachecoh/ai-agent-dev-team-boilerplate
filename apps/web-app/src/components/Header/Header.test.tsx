import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import Header from './Header';

describe('Header', () => {
  it('renders status pills and search on desktop layout', () => {
    render(
      <MemoryRouter initialEntries={['/recetas']}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText('PLANTA CENTRAL')).toBeInTheDocument();
    expect(screen.getByLabelText(/buscar en el sistema/i)).toBeInTheDocument();
    expect(screen.getByText('Carlos Mendez')).toBeInTheDocument();
  });

  it('calls onMenuClick when menu button is clicked', async () => {
    const user = userEvent.setup();
    const onMenuClick = vi.fn();

    render(
      <MemoryRouter>
        <Header showMenuButton onMenuClick={onMenuClick} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /abrir menú/i }));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });
});
