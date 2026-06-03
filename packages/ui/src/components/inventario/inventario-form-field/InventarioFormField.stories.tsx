import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { InventarioSelect } from '../inventario-select';
import {
  INVENTARIO_COMPONENT_DOCS,
  inventarioComponentDocs,
} from '../shared/inventario-story-docs';
import {
  inventarioDarkDecorator,
  inventarioLightDecorator,
  inventarioStoryMeta,
} from '../shared/story-decorators';
import { InventarioFormField } from './InventarioFormField';

const meta: Meta<typeof InventarioFormField> = {
  title: 'Inventario/InventarioFormField',
  component: InventarioFormField,
  ...inventarioStoryMeta,
  tags: ['autodocs'],
  parameters: inventarioComponentDocs(INVENTARIO_COMPONENT_DOCS.formField, '2075:1480'),
};

export default meta;
type Story = StoryObj<typeof InventarioFormField>;

export const InputField: Story = {
  args: { label: 'SKU', inputType: 'input' },
};

export const SelectField: Story = {
  args: {
    label: 'Categoría',
    bareControl: true,
    children: (
      <InventarioSelect
        options={[
          { value: 'proteins', label: 'Proteínas' },
          { value: 'grains', label: 'Granos' },
        ]}
        value="proteins"
        theme="dark"
      />
    ),
  },
};

export const DarkMode: Story = {
  decorators: [inventarioDarkDecorator],
  args: { ...InputField.args, theme: 'dark' },
};

export const LightMode: Story = {
  decorators: [inventarioLightDecorator],
  args: InputField.args,
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
      <InventarioFormField {...args} size="sm" />
      <InventarioFormField {...args} size="md" />
      <InventarioFormField {...args} size="xl" />
    </div>
  ),
  args: InputField.args,
};
