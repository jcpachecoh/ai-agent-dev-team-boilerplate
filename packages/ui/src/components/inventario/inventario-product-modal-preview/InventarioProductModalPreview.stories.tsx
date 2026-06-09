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
import { InventarioProductModalPreview } from './InventarioProductModalPreview';

const meta: Meta<typeof InventarioProductModalPreview> = {
  title: 'Inventario/InventarioProductModalPreview',
  component: InventarioProductModalPreview,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.productModalPreview, '2075:1463'),
  decorators: [inventarioDashboardDecorator],
};

export default meta;
type Story = StoryObj<typeof InventarioProductModalPreview>;

export const Default: Story = {};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Default.args,
};
