import type { Meta, StoryObj } from '@storybook/react';
import { ChefHat, MonitorSmartphone, Package } from 'lucide-react';

import { OperationsEntryCard } from './OperationsEntryCard';

const meta: Meta<typeof OperationsEntryCard> = {
  title: 'Field Ops/OperationsEntryCard',
  component: OperationsEntryCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#0f1115' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tarjeta de acceso para la pantalla inicial de operaciones. Permite personalizar icono, colores, textos y metadatos.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof OperationsEntryCard>;

export const Terminal: Story = {
  args: {
    category: 'Operador',
    title: 'Terminal de Estacion',
    description:
      'Pantalla de operacion para tableta. Cronometro de fases, registro de incidentes y confirmacion de produccion por estacion.',
    tags: ['EST-02', 'Fileteado y Porcionado'],
    icon: <MonitorSmartphone size={24} />,
    accent: 'mint',
    theme: 'dark',
    size: 'md',
  },
};

export const Proveedores: Story = {
  args: {
    category: 'Enterprise',
    title: 'Gestion de Proveedores',
    description:
      'Administracion centralizada de proveedores, catalogo de insumos, ordenes de compra y cuentas por pagar.',
    tags: ['Procurement', 'Enterprise'],
    icon: <Package size={24} />,
    accent: 'enterprise',
    theme: 'dark',
    size: 'md',
  },
};

export const Recetas: Story = {
  args: {
    category: 'Production',
    title: 'Gestion de Recetas',
    description:
      'Control de recetas de produccion, fases operacionales, validaciones y trazabilidad de ejecucion en planta.',
    tags: ['MES', 'Quality'],
    icon: <ChefHat size={24} />,
    accent: 'purple',
    theme: 'dark',
    size: 'md',
  },
};

export const LightTheme: Story = {
  args: {
    ...Recetas.args,
    theme: 'light',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#f2f0ea' }}>
        <Story />
      </div>
    ),
  ],
};

export const Small: Story = {
  args: {
    ...Terminal.args,
    size: 'sm',
  },
};
