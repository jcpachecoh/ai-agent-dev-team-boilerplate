import type { Meta, StoryObj } from '@storybook/react';

import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import {
  produccionDarkDecorator,
  produccionLightDecorator,
  produccionStoryMeta,
} from '../shared/story-decorators';
import { ProduccionStatusBadge } from './ProduccionStatusBadge';

const meta: Meta<typeof ProduccionStatusBadge> = {
  title: 'Produccion/ProduccionStatusBadge',
  component: ProduccionStatusBadge,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.statusBadge),
  argTypes: {
    status: {
      control: 'select',
      options: ['active', 'inactive', 'maintenance', 'published', 'draft', 'archived'],
    },
  },
};
export default meta;
type Story = StoryObj<typeof ProduccionStatusBadge>;
export const Active: Story = { args: { status: 'active' } };
export const Maintenance: Story = { args: { status: 'maintenance' } };
export const Published: Story = { args: { status: 'published' } };
export const Draft: Story = { args: { status: 'draft' } };
export const DarkMode: Story = { decorators: [produccionDarkDecorator], args: { theme: 'dark' } };
export const LightMode: Story = {
  decorators: [produccionLightDecorator],
  args: { theme: 'light' },
};
