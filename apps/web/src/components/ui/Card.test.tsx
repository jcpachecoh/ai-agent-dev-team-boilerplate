import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { Card } from './Card';

describe('Card', () => {
  it('usa la variante light por defecto sin hover', () => {
    render(<Card>Contenido</Card>);
    const card = screen.getByText('Contenido');
    expect(card.className).toContain('bg-white');
    expect(card.className).not.toContain('hover:-translate-y-1');
  });

  it('aplica variante glass, hover y className extra', () => {
    render(
      <Card variant="glass" hover className="extra-class">
        Vidrio
      </Card>,
    );
    const card = screen.getByText('Vidrio');
    expect(card.className).toContain('backdrop-blur-md');
    expect(card.className).toContain('hover:-translate-y-1');
    expect(card.className).toContain('extra-class');
  });
});
