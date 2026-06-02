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
import { InventarioPageHeader } from './InventarioPageHeader';

const meta: Meta<typeof InventarioPageHeader> = {
  title: 'Inventario/InventarioPageHeader',
  component: InventarioPageHeader,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.pageHeader, '2075:636'),
};

export default meta;
type Story = StoryObj<typeof InventarioPageHeader>;

export const Default: Story = {};

export const CustomCopy: Story = {
  args: {
    title: 'Inventario · Planta Central',
    subtitle: 'Vista consolidada · Actualización manual',
  },
};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  args: { theme: 'light' },
  decorators: [inventarioLightDecorator],
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <InventarioPageHeader {...args} size="sm" />
      <InventarioPageHeader {...args} size="md" />
      <InventarioPageHeader {...args} size="xl" />
    </div>
  ),
};
