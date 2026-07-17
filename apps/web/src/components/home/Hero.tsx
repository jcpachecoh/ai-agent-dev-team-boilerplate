'use client';

import { motion } from 'framer-motion';
import { ChevronRight, PlayCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';

const HEADLINE_LINE_1 = 'El ERP que entiende';
const HEADLINE_LINE_2 = 'tu restaurante';

function StaggeredHeadline({
  text,
  startDelay,
}: {
  text: string;
  startDelay: number;
}): React.JSX.Element {
  const words = text.split(' ');
  return (
    <span className="inline-block">
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: startDelay + index * 0.1,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="mr-3 inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export function Hero(): React.JSX.Element {
  return (
    <section className="relative isolate overflow-hidden bg-brand-950 pb-24 pt-40 lg:pb-32 lg:pt-48">
      <div
        className="pointer-events-none absolute inset-0 animate-pulse [animation-duration:3s]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(249,115,22,0.15) 0%, transparent 50%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur-md"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          Nuevo: Control de producción con IA
        </motion.div>

        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          <StaggeredHeadline text={HEADLINE_LINE_1} startDelay={0.1} />
          <br />
          <StaggeredHeadline text={HEADLINE_LINE_2} startDelay={0.5} />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-lg text-white/60"
        >
          Gestiona POS, inventario, nómina, contabilidad y producción desde una sola plataforma.
          Hecho para restaurantes en LATAM.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button href="/contacto" size="lg">
            Solicitar Demo
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button
            href="/nosotros"
            variant="ghost"
            size="lg"
            className="text-white hover:bg-white/10"
          >
            <PlayCircle className="h-5 w-5" />
            Ver cómo funciona
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-8 text-sm text-white/40"
        >
          Confiado por +50 restaurantes en Colombia
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="relative mx-auto mt-16 max-w-4xl"
        >
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md transition-transform duration-300 hover:scale-[1.02]">
            <div className="flex h-80 items-center justify-center text-white/30 sm:h-[28rem]">
              Dashboard preview
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
