import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Accordion } from './Accordion';

const meta: Meta<typeof Accordion> = {
  title: 'Moleculas/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  argTypes: {
    size: { control: { type: 'radio', options: ['sm', 'md', 'lg'] } },
    color: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;
type AnyStory = StoryObj<Record<string, any>>;

export const Single: Story = {
  render: (args) => (
    <Accordion
      type="single"
      collapsible
      size={args.size}
      color={args.color}
      items={[
        { value: 'one', trigger: 'Sección 1', content: 'Contenido 1' },
        { value: 'two', trigger: 'Sección 2', content: 'Contenido 2' },
      ]}
    />
  ),
};

export const FigmaExample: Story = {
  args: {
    type: 'single',
    defaultValue: 'item-2',

    items: [
      {
        value: 'item-1',
        trigger: '¿Qué es RestOpsIQ?',
        content: 'RestOpsIQ es la plataforma que centraliza operaciones y optimiza rutas.',
      },
      {
        value: 'item-2',
        trigger: '¿Cómo funciona el prorrateo de costos?',
        content:
          'Los costos de cada viaje (combustible, peajes, viáticos) se distribuyen proporcionalmente al peso de los pedidos entregados en cada sede. El resultado se exporta como reporte contable.',
      },
      {
        value: 'item-3',
        trigger: '¿Qué es el food cost?',
        content: 'El food cost es el porcentaje del costo de alimentos sobre el precio de venta.',
      },
      {
        value: 'item-4',
        trigger: 'Ítem deshabilitado',
        content: 'Este ítem está deshabilitado y no se puede abrir.',
        disabled: true,
      },
    ],

    size: 'lg',
    color: '#d4a017',
  },
};
