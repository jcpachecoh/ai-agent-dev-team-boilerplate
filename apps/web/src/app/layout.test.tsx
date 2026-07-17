import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import RootLayout, { metadata } from './layout';

describe('RootLayout', () => {
  beforeEach(() => {
    // RootLayout renders <html>, which jsdom cannot host under any container.
    // React 19's DOM-nesting validator warns even though its singleton handling
    // renders the layout correctly. Suppress only that known false alarm.
    const originalError = console.error.bind(console);
    jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const isKnownNestingWarning =
        typeof args[0] === 'string' && args[0].includes('cannot be a child of');
      if (isKnownNestingWarning) {
        return;
      }
      originalError(...(args as Parameters<typeof console.error>));
    });
  });

  it('renders children', () => {
    render(<RootLayout>{'content'}</RootLayout>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders navbar and footer', () => {
    render(<RootLayout>{'content'}</RootLayout>);
    expect(screen.getAllByText('OpsSync').length).toBeGreaterThan(0);
    expect(screen.getByText(/todos los derechos reservados/i)).toBeInTheDocument();
  });
});

describe('metadata', () => {
  it('has correct default title', () => {
    expect(metadata.title).toEqual({
      default: 'OpsSync — ERP para Restaurantes en LATAM',
      template: '%s | OpsSync',
    });
  });

  it('has correct description', () => {
    expect(metadata.description).toBe(
      'Plataforma ERP multi-sede para restaurantes: POS, inventarios, nómina, contabilidad y control de producción en una sola app.',
    );
  });
});
