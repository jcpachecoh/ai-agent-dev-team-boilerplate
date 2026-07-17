'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Card } from '@/components/ui/Card';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Unificamos 6 sedes en un solo panel. Lo que antes tomaba días de cuadre ahora es automático.',
    name: 'Camila Rojas',
    role: 'Gerente de Operaciones, La Brasa Roja',
  },
  {
    quote:
      'El control de mermas por receta nos ahorró más del 12% en costos de cocina en tres meses.',
    name: 'Andrés Molina',
    role: 'Chef Ejecutivo, Cocina Andina',
  },
  {
    quote:
      'La nómina se liquida sola con la legislación colombiana. Nos quitó horas de trabajo manual cada mes.',
    name: 'Laura Fonseca',
    role: 'Directora de RRHH, Sabores del Valle',
  },
];

export function Testimonials(): React.JSX.Element {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Lo que dicen nuestros clientes
          </h2>
        </AnimatedSection>

        <motion.div
          drag="x"
          dragConstraints={{ left: -0, right: 0 }}
          className="mt-16 grid cursor-grab grid-cols-1 gap-6 active:cursor-grabbing sm:grid-cols-2 lg:grid-cols-3 lg:cursor-default"
        >
          {TESTIMONIALS.map((testimonial) => (
            <Card key={testimonial.name} variant="light" className="flex h-full flex-col">
              <div className="flex gap-0.5 text-accent-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 flex-1 text-lg leading-relaxed text-neutral-700">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="mt-6">
                <p className="text-sm font-semibold text-neutral-900">{testimonial.name}</p>
                <p className="text-sm text-neutral-500">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
