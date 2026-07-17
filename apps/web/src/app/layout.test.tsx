import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import RootLayout, { metadata } from './layout';

describe('RootLayout', () => {
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
