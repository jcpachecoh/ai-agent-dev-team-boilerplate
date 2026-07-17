'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const STEPS = [
  {
    title: 'Configura tu restaurante',
    duration: '5 min',
    description: 'Registra sedes, usuarios y menú inicial.',
  },
  {
    title: 'Conecta tus operaciones',
    duration: '',
    description: 'POS, cocina, bodega y RRHH sincronizados.',
  },
  {
    title: 'Crece con datos',
    duration: '',
    description: 'Reportes, alertas y decisiones en tiempo real.',
  },
];

export function HowItWorks(): React.JSX.Element {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20% 0px' });

  return (
    <section ref={ref} className="bg-brand-900 py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Cómo funciona
        </h2>

        <div className="relative mt-20 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <svg
            className="pointer-events-none absolute left-0 right-0 top-6 hidden lg:block"
            width="100%"
            height="2"
            aria-hidden="true"
          >
            <motion.line
              x1="16%"
              y1="1"
              x2="84%"
              y2="1"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="2"
              strokeDasharray="1000"
              initial={{ strokeDashoffset: 1000 }}
              animate={{ strokeDashoffset: isInView ? 0 : 1000 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
          </svg>

          {STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                {index + 1}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">
                {step.title}
                {step.duration && (
                  <span className="ml-2 text-sm font-normal text-white/40">({step.duration})</span>
                )}
              </h3>
              <p className="mt-2 text-sm text-white/60">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
