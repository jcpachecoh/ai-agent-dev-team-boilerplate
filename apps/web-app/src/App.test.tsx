import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
  it('renders OperationsHub at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /panel de operaciones/i })).toBeInTheDocument();
    expect(screen.getByText(/gestion de recetas/i)).toBeInTheDocument();
  });

  it('navigates to recetas module from hub', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    expect(screen.getByRole('heading', { name: /administracion de recetas/i })).toBeInTheDocument();
  });

  it('renders NotFoundPage for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument();
  });
});
