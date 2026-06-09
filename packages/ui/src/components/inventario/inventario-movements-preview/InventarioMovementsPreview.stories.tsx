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
import { InventarioMovementsPreview } from './InventarioMovementsPreview';

const meta: Meta<typeof InventarioMovementsPreview> = {
  title: 'Inventario/InventarioMovementsPreview',
  component: InventarioMovementsPreview,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.movementsPreview, '2075:1662'),
  decorators: [inventarioDashboardDecorator],
};

export default meta;
type Story = StoryObj<typeof InventarioMovementsPreview>;

export const Default: Story = {};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Default.args,
};
