import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import Sidebar from './Sidebar';

describe('Sidebar', () => {
  it('renders navigation items from config', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('complementary', { name: /navegación principal/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /palos de leña/i })).toBeInTheDocument();
    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.getByText('Recetas')).toBeInTheDocument();
    expect(screen.getByText('Carlos Mendez')).toBeInTheDocument();
  });

  it('navigates to recetas when submenu link is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /recetas/i }));
    await user.click(screen.getByRole('link', { name: /lista de recetas/i }));

    expect(screen.getByRole('link', { name: /lista de recetas/i })).toHaveClass(/active/);
  });

  it('highlights active link on recetas route', () => {
    render(
      <MemoryRouter initialEntries={['/recetas']}>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /lista de recetas/i })).toHaveClass(/active/);
  });

  it('highlights only the current recetas sub-route', () => {
    render(
      <MemoryRouter initialEntries={['/recetas/historial']}>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /historial de ejecuciones/i })).toHaveClass(/active/);
    expect(screen.getByRole('link', { name: /lista de recetas/i })).not.toHaveClass(/active/);
  });

  it('calls onToggleCollapse when collapse button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleCollapse = vi.fn();

    render(
      <MemoryRouter>
        <Sidebar onToggleCollapse={onToggleCollapse} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /colapsar menú/i }));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });
});
