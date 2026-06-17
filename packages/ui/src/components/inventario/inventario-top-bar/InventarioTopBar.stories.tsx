import type { Meta, StoryObj } from '@storybook/react';

import {
  INVENTARIO_COMPONENT_DOCS,
  inventarioComponentDocs,
} from '../shared/inventario-story-docs';
import {
  inventarioDarkDecorator,
  inventarioDashboardDecorator,
  inventarioLightDecorator,
  inventarioStoryMeta,
} from '../shared/story-decorators';
import { InventarioTopBar } from './InventarioTopBar';

const meta: Meta<typeof InventarioTopBar> = {
  title: 'Inventario/InventarioTopBar',
  component: InventarioTopBar,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.topBar, '2075:599'),
  decorators: [inventarioDashboardDecorator],
};

export default meta;
type Story = StoryObj<typeof InventarioTopBar>;

export const Default: Story = {};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Default.args,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <InventarioTopBar {...args} size="sm" />
      <InventarioTopBar {...args} size="md" />
      <InventarioTopBar {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};
