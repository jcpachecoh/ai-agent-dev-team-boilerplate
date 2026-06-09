import type { Meta, StoryObj } from '@storybook/react';

import {
  PRODUCCION_COMPONENT_DOCS,
  produccionComponentDocs,
} from '../shared/produccion-story-docs';
import { produccionStoryMeta } from '../shared/story-decorators';
import { ProduccionFilterChipGroup } from './ProduccionFilterChipGroup';

const meta: Meta<typeof ProduccionFilterChipGroup> = {
  title: 'Produccion/ProduccionFilterChipGroup',
  component: ProduccionFilterChipGroup,
  ...produccionStoryMeta,
  parameters: produccionComponentDocs(PRODUCCION_COMPONENT_DOCS.filterChipGroup, '2096:1429'),
};
export default meta;
type Story = StoryObj<typeof ProduccionFilterChipGroup>;
export const StationFilters: Story = {
  args: {
    theme: 'light',
  },
};
export const RecipeFilters: Story = {
  args: {
    chips: [
      { id: 'all', label: 'TODAS' },
      { id: 'proteins', label: 'PROTEÍNAS' },
      { id: 'salads', label: 'ENSALADAS' },
      { id: 'sides', label: 'ACOMPAÑAMIENTOS' },
    ],

    theme: 'light',
  },
};
