import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UsuarioStatusBadge } from './UsuarioStatusBadge';

describe('UsuarioStatusBadge', () => {
  it('renders ACTIVO label when active', () => {
    render(<UsuarioStatusBadge active />);
    expect(screen.getByText('ACTIVO')).toBeTruthy();
  });

  it('renders INACTIVO label when inactive', () => {
    render(<UsuarioStatusBadge active={false} />);
    expect(screen.getByText('INACTIVO')).toBeTruthy();
  });
});
