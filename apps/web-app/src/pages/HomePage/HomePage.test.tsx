import { render, screen } from '@testing-library/react';
import HomePage from './HomePage';

describe('HomePage', () => {
  it('renders the Home heading', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { level: 1, name: /home/i })).toBeInTheDocument();
  });
});
