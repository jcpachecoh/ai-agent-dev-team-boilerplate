import type { Metadata } from 'next';

import { CtaSection } from '@/components/home/CtaSection';
import { Features } from '@/components/home/Features';
import { Hero } from '@/components/home/Hero';
import { HowItWorks } from '@/components/home/HowItWorks';
import { ModulesGrid } from '@/components/home/ModulesGrid';
import { SocialProof } from '@/components/home/SocialProof';
import { Testimonials } from '@/components/home/Testimonials';

export const metadata: Metadata = {
  title: 'OpsSync — ERP para Restaurantes en LATAM',
  description:
    'Gestiona POS, inventario, nómina y contabilidad desde una sola plataforma. Hecho para restaurantes en Colombia y LATAM.',
  openGraph: { images: ['/og-home.png'] },
};

export default function Home(): React.JSX.Element {
  return (
    <>
      <Hero />
      <SocialProof />
      <Features />
      <ModulesGrid />
      <HowItWorks />
      <Testimonials />
      <CtaSection />
    </>
  );
}
