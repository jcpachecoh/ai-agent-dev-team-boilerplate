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
import { InventarioFormActions } from './InventarioFormActions';

const meta: Meta<typeof InventarioFormActions> = {
  title: 'Inventario/InventarioFormActions',
  component: InventarioFormActions,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.modal, '2075:1520'),
};

export default meta;
type Story = StoryObj<typeof InventarioFormActions>;

export const Default: Story = {};
export const SaveDisabled: Story = { args: { saveDisabled: true } };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <InventarioFormActions {...args} size="sm" />
      <InventarioFormActions {...args} size="md" />
      <InventarioFormActions {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};
