import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { InventarioBarRow } from '../inventario-bar-row';
import {
  INVENTARIO_COMPONENT_DOCS,
  inventarioComponentDocs,
} from '../shared/inventario-story-docs';
import { inventarioLightDecorator, inventarioStoryMeta } from '../shared/story-decorators';
import { InventarioPanel } from './InventarioPanel';

const meta: Meta<typeof InventarioPanel> = {
  title: 'Inventario/InventarioPanel',
  component: InventarioPanel,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.panel, '2075:686'),
};

export default meta;
type Story = StoryObj<typeof InventarioPanel>;

export const Default: Story = {
  args: {
    title: 'Top 10 Productos por Stock',
    size: 'xl',
    children: <p style={{ margin: 0, color: '#888', fontSize: 14 }}>Contenido del panel</p>,
  },
};

export const WithBarRows: Story = {
  args: {
    title: 'Top 10 Productos por Stock',
    size: 'xl',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <InventarioBarRow
          label="POLLO ENTERO"
          value={850}
          progress={100}
          accent="success"
          theme="dark"
          size="xl"
        />
        <InventarioBarRow
          label="CARNE MOLIDA"
          value={620}
          progress={73}
          accent="success"
          theme="dark"
          size="xl"
        />
      </div>
    ),
  },
};

export const DarkMode: Story = {
  args: { ...WithBarRows.args, theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: {
    title: 'Top 10 Productos por Stock',
    size: 'xl',
    theme: 'light',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <InventarioBarRow
          label="POLLO ENTERO"
          value={850}
          progress={100}
          accent="success"
          theme="light"
          size="xl"
        />
        <InventarioBarRow
          label="CARNE MOLIDA"
          value={620}
          progress={73}
          accent="success"
          theme="light"
          size="xl"
        />
      </div>
    ),
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <InventarioPanel {...args} size="sm" title="Panel SM" />
      <InventarioPanel {...args} size="md" title="Panel MD" />
      <InventarioPanel {...args} size="xl" title="Panel XL" />
    </div>
  ),
  args: WithBarRows.args,
};
