import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { ThemeProvider } from '@/providers/ThemeProvider';

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
      <ThemeProvider initialTheme="dark">
        <MemoryRouter>
          <Layout>
            <p>Contenido principal</p>
          </Layout>
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(screen.getByRole('img', { name: /palos de leña/i })).toBeInTheDocument();
    expect(screen.getByText('Contenido principal')).toBeInTheDocument();
    expect(screen.getByLabelText(/cambiar tema claro u oscuro/i)).toBeInTheDocument();
  });

  it('toggles sidebar collapse on desktop', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider initialTheme="dark">
        <MemoryRouter>
          <Layout>
            <span />
          </Layout>
        </MemoryRouter>
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: /colapsar menú/i }));
    expect(screen.getByRole('button', { name: /expandir menú/i })).toBeInTheDocument();
  });

  it('passes light theme to sidebar when provider is in light mode', () => {
    render(
      <ThemeProvider initialTheme="light">
        <MemoryRouter>
          <Layout>
            <span />
          </Layout>
        </MemoryRouter>
      </ThemeProvider>,
    );

    const sidebar = document.querySelector('[class*="themeLight"]');
    expect(sidebar).toBeTruthy();
  });
});
