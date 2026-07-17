import {
  BarChart3,
  ChefHat,
  Handshake,
  Lock,
  Smartphone,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Card } from '@/components/ui/Card';

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const FEATURES: Feature[] = [
  {
    title: 'Operación en tiempo real',
    description: 'Datos sincronizados entre todas tus sedes al instante.',
    icon: Zap,
    color: 'bg-accent-500/10 text-accent-600',
  },
  {
    title: 'Multi-sede seguro',
    description: 'Cada sede aislada, con un panel de control unificado.',
    icon: Lock,
    color: 'bg-brand-500/10 text-brand-600',
  },
  {
    title: 'Reportes inteligentes',
    description: 'Dashboards accionables en lugar de tablas sin contexto.',
    icon: BarChart3,
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    title: 'Proveedores integrados',
    description: 'Pedidos, facturas y pagos en un solo lugar.',
    icon: Handshake,
    color: 'bg-rose-50 text-rose-600',
  },
  {
    title: 'Control de recetas',
    description: 'Costeo automático y control de mermas por receta.',
    icon: ChefHat,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    title: 'Nativo en móvil',
    description: 'Kiosko de turnos y POS desde cualquier dispositivo.',
    icon: Smartphone,
    color: 'bg-emerald-50 text-emerald-600',
  },
];

export function Features(): React.JSX.Element {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Todo lo que necesita tu restaurante
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Una plataforma integrada, sin silos de datos.
          </p>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <AnimatedSection key={feature.title} delay={index * 0.1}>
              <Card variant="light" hover className="h-full">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${feature.color}`}
                >
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-neutral-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {feature.description}
                </p>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
