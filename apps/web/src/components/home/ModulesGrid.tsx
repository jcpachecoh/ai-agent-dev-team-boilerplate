import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Card } from '@/components/ui/Card';
import { MODULE_ICONS } from '@/lib/module-icons';
import { MODULES } from '@/lib/navigation';

export function ModulesGrid(): React.JSX.Element {
  return (
    <section className="bg-neutral-50 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Un módulo para cada área de tu restaurante
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Actívalos todos o empieza con lo esencial.
          </p>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((mod, index) => {
            const Icon = MODULE_ICONS[mod.icon];
            return (
              <AnimatedSection key={mod.href} delay={index * 0.05}>
                <Link href={mod.href} className="block h-full">
                  <Card variant="light" hover className="h-full">
                    <Icon className={`h-10 w-10 ${mod.color}`} />
                    <h3 className="mt-4 text-base font-semibold text-neutral-900">{mod.label}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                      {mod.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                      Ver más
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Card>
                </Link>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
