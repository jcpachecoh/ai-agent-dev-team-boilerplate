import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { Button } from './Button';

describe('Button', () => {
  it('renderiza un <a> cuando recibe href', () => {
    render(<Button href="/contacto">Demo</Button>);
    const link = screen.getByRole('link', { name: 'Demo' });
    expect(link).toHaveAttribute('href', '/contacto');
    expect(link.className).toContain('bg-brand-600');
  });

  it('renderiza un <button> nativo sin href', () => {
    render(<Button onClick={jest.fn()}>Enviar</Button>);
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
  });

  it('aplica variant y size explícitos', () => {
    render(
      <Button variant="outline" size="lg">
        Ver más
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Ver más' });
    expect(button.className).toContain('border-brand-600');
    expect(button.className).toContain('px-8');
  });
});
