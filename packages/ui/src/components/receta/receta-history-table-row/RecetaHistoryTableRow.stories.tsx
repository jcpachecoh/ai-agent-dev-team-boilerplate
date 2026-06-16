import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { recetaDarkDecorator, recetaStoryMeta } from '../shared/story-decorators';
import { RecetaHistoryTableRow } from './RecetaHistoryTableRow';

const meta: Meta<typeof RecetaHistoryTableRow> = {
  title: 'Receta/RecetaHistoryTableRow',
  component: RecetaHistoryTableRow,
  ...recetaStoryMeta,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RecetaHistoryTableRow>;

export const OkHistory: Story = { args: { result: 'ok' } };
export const WarningHistory: Story = {
  args: {
    result: 'warning',
    code: 'EX-002',
    progress: '5/6',
    validationsOk: 10,
    validationsFailed: 2,
    duration: '51 / 45 min',
  },
};
export const FailedHistory: Story = {
  args: {
    result: 'failed',
    code: 'EX-003',
    recipeName: 'Costillas BBQ',
    progress: '3/6',
    validationsOk: 7,
    validationsFailed: 5,
  },
};
export const DarkMode: Story = { decorators: [recetaDarkDecorator], args: { theme: 'dark' } };
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <RecetaHistoryTableRow {...args} size="sm" />
      <RecetaHistoryTableRow {...args} size="md" />
      <RecetaHistoryTableRow {...args} size="xl" />
    </div>
  ),
};
