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
import { InventarioReportFilterBar } from './InventarioReportFilterBar';

const meta: Meta<typeof InventarioReportFilterBar> = {
  title: 'Inventario/InventarioReportFilterBar',
  component: InventarioReportFilterBar,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.reportFilterBar, '2075:2192'),
};

export default meta;
type Story = StoryObj<typeof InventarioReportFilterBar>;

export const Default: Story = {};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: { theme: 'light' },
};
