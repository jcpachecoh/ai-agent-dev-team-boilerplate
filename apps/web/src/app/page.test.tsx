import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import Home from './page';

describe('Home', () => {
  it('renders hero headline', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/el.?erp.?que.?entiende/i);
  });

  it('renders the modules grid section', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: /un módulo para cada área/i })).toBeInTheDocument();
  });

  it('renders demo CTAs linking to /contacto', () => {
    render(<Home />);
    const demoLinks = screen.getAllByRole('link', { name: /solicitar demo/i });
    expect(demoLinks.length).toBeGreaterThan(0);
    demoLinks.forEach((link) => expect(link).toHaveAttribute('href', '/contacto'));
  });
});
