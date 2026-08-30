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
import { InventarioReportDataTable } from './InventarioReportDataTable';

const meta: Meta<typeof InventarioReportDataTable> = {
  title: 'Inventario/InventarioReportDataTable',
  component: InventarioReportDataTable,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.reportDataTable, '2075:2225'),
};

export default meta;
type Story = StoryObj<typeof InventarioReportDataTable>;

export const Default: Story = {};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: { theme: 'light' },
};
