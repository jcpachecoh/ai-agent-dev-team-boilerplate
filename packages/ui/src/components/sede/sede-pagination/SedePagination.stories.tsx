import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedePagination } from './SedePagination';

const meta: Meta<typeof SedePagination> = {
  title: 'Sede/SedePagination',
  component: SedePagination,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedePagination>;

export const Default: Story = {
  args: { page: 1, totalPages: 2, summary: 'Mostrando 1-6 de 10' },
};
