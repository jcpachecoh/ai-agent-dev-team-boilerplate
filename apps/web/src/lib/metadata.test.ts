import { buildMetadata } from './metadata';

describe('buildMetadata', () => {
  it('construye metadata con la imagen OG por defecto', () => {
    const metadata = buildMetadata({
      title: 'Precios',
      description: 'Planes para tu restaurante',
      path: '/precios',
    });

    expect(metadata.title).toBe('Precios');
    expect(metadata.alternates?.canonical).toBe('https://opssynk.com/precios');
    expect(metadata.openGraph?.images).toEqual([
      { url: '/og-default.png', width: 1200, height: 630 },
    ]);
    expect(metadata.twitter?.images).toEqual(['/og-default.png']);
  });

  it('usa la imagen OG personalizada cuando se indica', () => {
    const metadata = buildMetadata({
      title: 'Nosotros',
      description: 'Nuestro equipo',
      path: '/nosotros',
      ogImage: '/og-nosotros.png',
    });

    expect(metadata.openGraph?.url).toBe('https://opssynk.com/nosotros');
    expect(metadata.twitter?.images).toEqual(['/og-nosotros.png']);
  });
});
