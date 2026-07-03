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
import { InventarioAlertsPreview } from './InventarioAlertsPreview';

const meta: Meta<typeof InventarioAlertsPreview> = {
  title: 'Inventario/InventarioAlertsPreview',
  component: InventarioAlertsPreview,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.alertsPreview, '2075:1910'),
  decorators: [inventarioDashboardDecorator],
};

export default meta;
type Story = StoryObj<typeof InventarioAlertsPreview>;

export const Default: Story = {};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: Default.args,
};
