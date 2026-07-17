import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { Badge } from './Badge';

describe('Badge', () => {
  it('usa el color brand por defecto', () => {
    render(<Badge>Nuevo</Badge>);
    const badge = screen.getByText('Nuevo');
    expect(badge.className).toContain('text-brand-600');
  });

  it('aplica el color indicado y className extra', () => {
    render(
      <Badge color="emerald" className="extra-class">
        Activo
      </Badge>,
    );
    const badge = screen.getByText('Activo');
    expect(badge.className).toContain('text-emerald-700');
    expect(badge.className).toContain('extra-class');
  });
});
