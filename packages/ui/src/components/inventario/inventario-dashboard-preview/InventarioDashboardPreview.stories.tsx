import type { Meta, StoryObj } from '@storybook/react';

import {
  INVENTARIO_COMPONENT_DOCS,
  inventarioComponentDocs,
} from '../shared/inventario-story-docs';
import { inventarioDashboardDecorator, inventarioStoryMeta } from '../shared/story-decorators';
import { InventarioDashboardPreview } from './InventarioDashboardPreview';

const meta: Meta<typeof InventarioDashboardPreview> = {
  title: 'Inventario/InventarioDashboardPreview',
  component: InventarioDashboardPreview,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  decorators: [inventarioDashboardDecorator],
  parameters: {
    ...inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.dashboardPreview, '2075:598'),
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof InventarioDashboardPreview>;

export const FullScreen: Story = {};

export const LightMode: Story = {
  args: { theme: 'light' },
};
