import { render, screen } from '@testing-library/react';
import NotFoundPage from './NotFoundPage';

describe('NotFoundPage', () => {
  it('renders the 404 heading', () => {
    render(<NotFoundPage />);

    expect(screen.getByRole('heading', { level: 1, name: /404/i })).toBeInTheDocument();
  });

  it('renders the descriptive message', () => {
    render(<NotFoundPage />);

    expect(screen.getByText(/does not exist/i)).toBeInTheDocument();
  });
});
