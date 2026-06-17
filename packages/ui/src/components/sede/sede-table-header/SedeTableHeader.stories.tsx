import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeTableHeader } from './SedeTableHeader';

const meta: Meta<typeof SedeTableHeader> = {
  title: 'Sede/SedeTableHeader',
  component: SedeTableHeader,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeTableHeader>;

export const Default: Story = {};
