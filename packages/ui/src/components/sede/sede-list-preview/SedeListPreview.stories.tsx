import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeListPreview } from './SedeListPreview';

const meta: Meta<typeof SedeListPreview> = {
  title: 'Sede/Compositions/SedeListPreview',
  component: SedeListPreview,
  ...sedeStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SedeListPreview>;

export const Default: Story = {};

export const WithFilters: Story = {
  args: {
    searchValue: 'Cartagena',
    statusFilter: 'active',
  },
};
