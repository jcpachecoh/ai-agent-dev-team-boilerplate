import type { Meta, StoryObj } from '@storybook/react';

import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionTypeBadge } from './ProduccionTypeBadge';

const meta: Meta<typeof ProduccionTypeBadge> = {
  title: 'Produccion/ProduccionTypeBadge',
  component: ProduccionTypeBadge,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.typeBadge),
  argTypes: {
    tone: {
      control: 'select',
      options: [
        'preparation',
        'processing',
        'cooking',
        'cooling',
        'packing',
        'maturation',
        'sanitation',
        'neutral',
      ],
    },
  },
};
export default meta;
type Story = StoryObj<typeof ProduccionTypeBadge>;
export const Default: Story = {};
export const Cooking: Story = { args: { label: 'Cocción', tone: 'cooking' } };
export const Sanitation: Story = { args: { label: 'Sanitización', tone: 'sanitation' } };
