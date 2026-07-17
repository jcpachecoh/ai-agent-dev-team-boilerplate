import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Navbar } from './Navbar';

const mockUsePathname = jest.fn<string, []>();

jest.mock('next/navigation', () => ({
  usePathname: (): string => mockUsePathname(),
}));

function setScrollY(value: number): void {
  Object.defineProperty(window, 'scrollY', { value, writable: true, configurable: true });
}

describe('Navbar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    setScrollY(0);
    // jsdom no implementa scrollTo; framer-motion lo invoca al medir keyframes
    window.scrollTo = jest.fn();
  });

  it('en home sin scroll el header es transparente', () => {
    render(<Navbar />);
    const header = screen.getByRole('banner');
    expect(header.className).toContain('bg-transparent');
  });

  it('al hacer scroll el header se vuelve sólido y vuelve a transparente al subir', () => {
    render(<Navbar />);
    setScrollY(30);
    fireEvent.scroll(window);
    expect(screen.getByRole('banner').className).toContain('bg-white/95');

    setScrollY(0);
    fireEvent.scroll(window);
    expect(screen.getByRole('banner').className).toContain('bg-transparent');
  });

  it('fuera de home el header es sólido sin scroll', () => {
    mockUsePathname.mockReturnValue('/precios');
    render(<Navbar />);
    expect(screen.getByRole('banner').className).toContain('bg-white/95');
  });

  it('el dropdown de módulos abre con mouseEnter y cierra con mouseLeave', async () => {
    render(<Navbar />);
    const modulesButton = screen.getByRole('button', { name: /módulos/i });
    const wrapper = modulesButton.parentElement as HTMLElement;

    fireEvent.mouseEnter(wrapper);
    expect(await screen.findByText('Punto de Venta')).toBeInTheDocument();

    fireEvent.mouseLeave(wrapper);
    await waitFor(() => {
      expect(screen.queryByText('Punto de Venta')).not.toBeInTheDocument();
    });
  });

  it('el menú móvil abre, expande módulos y cierra', async () => {
    render(<Navbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const closeButton = await screen.findByRole('button', { name: 'Cerrar menú' });

    // Dentro del panel móvil hay un segundo botón "Módulos" (accordion)
    const mobileModulesButton = screen
      .getAllByRole('button', { name: /módulos/i })
      .at(-1) as HTMLElement;
    fireEvent.click(mobileModulesButton);
    expect(await screen.findByText('Punto de Venta')).toBeInTheDocument();

    fireEvent.click(mobileModulesButton);
    await waitFor(() => {
      expect(screen.queryByText('Punto de Venta')).not.toBeInTheDocument();
    });

    fireEvent.click(closeButton);
    expect(await screen.findByRole('button', { name: 'Abrir menú' })).toBeInTheDocument();
  });
});
