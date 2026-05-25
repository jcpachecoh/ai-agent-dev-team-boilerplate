import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Truck } from 'lucide-react';
import { darkBackground, lightBackground } from '../../storybook/theme-helpers';
import { Accordion } from './Accordion';

const sampleItems = [
  {
    value: 'item-1',
    trigger: '¿Qué es RestOpsIQ?',
    content: 'RestOpsIQ centraliza operaciones y optimiza rutas.',
  },
  {
    value: 'item-2',
    trigger: '¿Cómo funciona el prorrateo?',
    content: 'Los costos se distribuyen proporcionalmente al peso de los pedidos.',
    leftIcon: <Truck size={20} aria-hidden />,
  },
  {
    value: 'item-3',
    trigger: 'Ítem deshabilitado',
    content: 'Este ítem no se puede abrir.',
    disabled: true,
  },
];

const meta: Meta<typeof Accordion> = {
  title: 'Moleculas/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  argTypes: {
    size: { control: { type: 'radio', options: ['sm', 'md', 'lg'] } },
    theme: { control: { type: 'radio', options: ['light', 'dark'] } },
    color: { control: 'color' },
  },
  args: {
    type: 'single',
    collapsible: true,
    items: sampleItems,
    size: 'md',
    theme: 'light',
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Playground: Story = {};

export const LightAllSizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24, maxWidth: 640 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Accordion key={size} {...args} theme="light" size={size} defaultValue="item-1" />
      ))}
    </div>
  ),
  ...lightBackground,
};

export const DarkAllSizes: Story = {
  render: LightAllSizes.render,
  ...darkBackground,
};

export const MultipleOpen: Story = {
  args: {
    type: 'multiple',
    defaultValue: ['item-1', 'item-2'],
    theme: 'dark',
  },
  ...darkBackground,
};

export const Single: Story = {
  args: {
    defaultValue: 'item-2',
    color: '#d4a017',
    size: 'lg',
    theme: 'dark',
  },
  ...darkBackground,
};
