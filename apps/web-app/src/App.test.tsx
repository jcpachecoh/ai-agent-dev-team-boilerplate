import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('1024px'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('renders dashboard at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /restopsiq plant/i })).toBeInTheDocument();
    expect(screen.getByText(/estaciones activas/i)).toBeInTheDocument();
  });

  it('navigates to recetas module from sidebar', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /recetas/i }));
    await user.click(screen.getByRole('link', { name: /lista de recetas/i }));

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
