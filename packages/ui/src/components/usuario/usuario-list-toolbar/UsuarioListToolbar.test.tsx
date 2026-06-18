import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { UsuarioListToolbar } from './UsuarioListToolbar';

describe('UsuarioListToolbar', () => {
  it('emits onSearchChange when typing in search input', async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();

    render(
      <UsuarioListToolbar count={3} searchValue="" onSearchChange={onSearchChange} theme="dark" />,
    );

    await user.type(screen.getByPlaceholderText(/Buscar por email/i), 'owner');

    expect(onSearchChange).toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenLastCalledWith('owner');
  });
});
