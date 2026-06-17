import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UserMenu from './UserMenu';

describe('UserMenu', () => {
  it('renders user name and avatar', () => {
    render(<UserMenu />);

    expect(screen.getByText('Carlos Mendez')).toBeInTheDocument();
  });

  it('opens dropdown and calls onLogout', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();

    render(<UserMenu onLogout={onLogout} />);

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(screen.getByRole('menuitem', { name: /cerrar sesión/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
