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
import { InventarioReportsPreview } from './InventarioReportsPreview';

const meta: Meta<typeof InventarioReportsPreview> = {
  title: 'Inventario/InventarioReportsPreview',
  component: InventarioReportsPreview,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.reportsPreview, '2075:2185'),
  decorators: [inventarioDashboardDecorator],
};

export default meta;
type Story = StoryObj<typeof InventarioReportsPreview>;

export const Default: Story = {};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: { theme: 'light' },
};
