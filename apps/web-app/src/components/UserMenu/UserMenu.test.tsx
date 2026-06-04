import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserMenu from './UserMenu';

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: vi.fn(),
}));

import { useMe } from '@/features/auth/hooks/useMe';

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMe).mockReturnValue({
      data: {
        id: 'user-1',
        email: 'mes-owner@palos-de-lena.dev',
        displayName: 'Mes Owner',
        displayRole: 'Operador',
      },
      isPending: false,
      isError: false,
      isLoading: false,
      status: 'success',
    } as ReturnType<typeof useMe>);
  });

  it('renders user name from me query', () => {
    render(<UserMenu />);

    expect(screen.getByText('Mes Owner')).toBeInTheDocument();
  });

  it('opens dropdown and calls onLogout', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();

    render(<UserMenu onLogout={onLogout} />);

    await user.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('mes-owner@palos-de-lena.dev')).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: /cerrar sesión/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
