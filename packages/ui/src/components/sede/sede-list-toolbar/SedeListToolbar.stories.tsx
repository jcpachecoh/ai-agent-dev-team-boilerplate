import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeListToolbar } from './SedeListToolbar';

const meta: Meta<typeof SedeListToolbar> = {
  title: 'Sede/SedeListToolbar',
  component: SedeListToolbar,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeListToolbar>;

export const Default: Story = {};
export const WithFilters: Story = {
  args: { searchValue: 'Bocagrande', statusFilter: 'active' },
};
