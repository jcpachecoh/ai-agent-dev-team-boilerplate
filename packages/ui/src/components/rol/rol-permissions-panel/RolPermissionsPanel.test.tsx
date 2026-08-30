import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RolPermissionsPanel } from './RolPermissionsPanel';

describe('RolPermissionsPanel', () => {
  it('shows readonly note when canEdit is false', () => {
    render(
      <RolPermissionsPanel
        roleName="Nómina"
        roleCode="NOMINA"
        canEdit={false}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText(/Solo lectura/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).toBeNull();
  });

  it('disables save when not dirty', () => {
    render(
      <RolPermissionsPanel
        roleName="Owner"
        roleCode="OWNER"
        canEdit
        dirtyCount={0}
        onClose={() => undefined}
        onSave={() => undefined}
        onDiscard={() => undefined}
      />,
    );

    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toHaveProperty(
      'disabled',
      true,
    );
  });
});
