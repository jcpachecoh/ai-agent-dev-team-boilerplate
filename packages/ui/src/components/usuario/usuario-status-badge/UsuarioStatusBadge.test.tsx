import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UsuarioStatusBadge } from './UsuarioStatusBadge';

describe('UsuarioStatusBadge', () => {
  it('renders Activo label when active', () => {
    render(<UsuarioStatusBadge active />);
    expect(screen.getByText('Activo')).toBeTruthy();
  });

  it('renders Inactivo label when inactive', () => {
    render(<UsuarioStatusBadge active={false} />);
    expect(screen.getByText('Inactivo')).toBeTruthy();
  });
});
