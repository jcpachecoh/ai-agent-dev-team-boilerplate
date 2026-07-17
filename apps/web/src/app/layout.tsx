import { Analytics } from '@vercel/analytics/react';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';

import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://opssynk.com'),
  title: {
    default: 'OpsSync — ERP para Restaurantes en LATAM',
    template: '%s | OpsSync',
  },
  description:
    'Plataforma ERP multi-sede para restaurantes: POS, inventarios, nómina, contabilidad y control de producción en una sola app.',
  keywords: [
    'ERP restaurantes',
    'software restaurante Colombia',
    'POS restaurante',
    'control inventarios restaurante',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://opssynk.com',
    siteName: 'OpsSync',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@opssynk',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-white text-neutral-900 antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
