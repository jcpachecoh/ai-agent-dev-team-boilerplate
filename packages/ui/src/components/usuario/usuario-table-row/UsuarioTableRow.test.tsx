import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { UsuarioTableRow } from './UsuarioTableRow';

describe('UsuarioTableRow', () => {
  const baseProps = {
    id: 'user-1',
    name: 'Juan Carlos Pérez',
    email: 'owner@test.dev',
    cedula: '12345678',
    documentType: 'CC',
    roleName: 'Propietario',
    roleCode: 'OWNER',
    isActive: true,
    lastLoginAt: '2026-06-15T10:30:00.000Z',
  };

  it('renders row columns', () => {
    render(<UsuarioTableRow {...baseProps} />);
    expect(screen.getByText('Juan Carlos Pérez')).toBeTruthy();
    expect(screen.getByText('owner@test.dev')).toBeTruthy();
    expect(screen.getByText('12345678')).toBeTruthy();
    expect(screen.getByText('Propietario')).toBeTruthy();
  });

  it('hides action buttons when showActions is false', () => {
    render(<UsuarioTableRow {...baseProps} showActions={false} />);
    expect(screen.queryByLabelText('Editar usuario')).toBeNull();
    expect(screen.queryByLabelText('Desactivar usuario')).toBeNull();
  });
});
