import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from './AppLayout';

describe('AppLayout', () => {
  it('renders children inside main', () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <p>Test content</p>
        </AppLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders the navigation bar', () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <span />
        </AppLayout>
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByText('RestOpsIQ')).toBeInTheDocument();
  });

  it('renders the footer with a version string', () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <span />
        </AppLayout>
      </MemoryRouter>,
    );

    // footer contains "v<version>" — at minimum starts with "v"
    expect(screen.getByRole('contentinfo').textContent).toMatch(/^v/);
  });
});
