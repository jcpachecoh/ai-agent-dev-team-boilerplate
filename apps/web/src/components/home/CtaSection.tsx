import { ChevronRight } from 'lucide-react';

import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';

export function CtaSection(): React.JSX.Element {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 py-24">
      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
        <AnimatedSection>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            ¿Listo para transformar tu operación?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Agenda una demo gratuita de 30 minutos con nuestro equipo.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              href="/contacto"
              size="lg"
              className="group bg-white text-brand-700 hover:bg-neutral-50"
            >
              Solicitar Demo Gratis
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              href="/contacto"
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/10"
            >
              Hablar con ventas
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
