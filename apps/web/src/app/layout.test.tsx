import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import RootLayout, { metadata } from './layout';

describe('RootLayout', () => {
  it('renders children', () => {
    render(
      <RootLayout>
        <div data-testid="child">content</div>
      </RootLayout>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

describe('metadata', () => {
  it('has correct title', () => {
    expect(metadata.title).toBe('RestOpsIQ');
  });

  it('has correct description', () => {
    expect(metadata.description).toBe('Restaurant Operations Intelligence Platform');
  });
});
