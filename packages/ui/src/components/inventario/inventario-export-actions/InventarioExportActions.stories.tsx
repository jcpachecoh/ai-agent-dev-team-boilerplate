import type { Meta, StoryObj } from '@storybook/react';

import {
  INVENTARIO_COMPONENT_DOCS,
  inventarioComponentDocs,
} from '../shared/inventario-story-docs';
import {
  inventarioDarkDecorator,
  inventarioLightDecorator,
  inventarioStoryMeta,
} from '../shared/story-decorators';
import { InventarioExportActions } from './InventarioExportActions';

const meta: Meta<typeof InventarioExportActions> = {
  title: 'Inventario/InventarioExportActions',
  component: InventarioExportActions,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.exportActions, '2075:2208'),
};

export default meta;
type Story = StoryObj<typeof InventarioExportActions>;

export const Default: Story = {};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: { theme: 'light' },
};
