import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import Home from './page';

describe('Home', () => {
  it('renders platform heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: /restopsiq platform/i })).toBeInTheDocument();
  });

  it('renders welcome message', () => {
    render(<Home />);
    expect(screen.getByText(/welcome to the restopsiq web application/i)).toBeInTheDocument();
  });
});
