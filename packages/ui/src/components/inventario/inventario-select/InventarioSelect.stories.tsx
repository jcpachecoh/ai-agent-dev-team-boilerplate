import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import {
  INVENTARIO_COMPONENT_DOCS,
  inventarioComponentDocs,
} from '../shared/inventario-story-docs';
import {
  inventarioDarkDecorator,
  inventarioLightDecorator,
  inventarioStoryMeta,
} from '../shared/story-decorators';
import { InventarioSelect } from './InventarioSelect';

const categoryOptions = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'proteins', label: 'Proteínas' },
  { value: 'grains', label: 'Granos' },
];

const meta: Meta<typeof InventarioSelect> = {
  title: 'Inventario/InventarioSelect',
  component: InventarioSelect,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.select, '2075:1024'),
};

export default meta;
type Story = StoryObj<typeof InventarioSelect>;

export const Default: Story = {
  args: { options: categoryOptions, value: 'all' },
};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { ...Default.args, theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Default.args,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <InventarioSelect {...args} size="sm" />
      <InventarioSelect {...args} size="md" />
      <InventarioSelect {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};
