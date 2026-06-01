import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import Layout from './Layout';

describe('Layout', () => {
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

  it('renders sidebar, header and children', () => {
    render(
      <MemoryRouter>
        <Layout>
          <p>Contenido principal</p>
        </Layout>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Plant MES' })).toBeInTheDocument();
    expect(screen.getByText('Contenido principal')).toBeInTheDocument();
    expect(screen.getByText('PLANTA CENTRAL')).toBeInTheDocument();
  });

  it('toggles sidebar collapse on desktop', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Layout>
          <span />
        </Layout>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /colapsar menú/i }));
    expect(screen.getByRole('button', { name: /expandir menú/i })).toBeInTheDocument();
  });
});
