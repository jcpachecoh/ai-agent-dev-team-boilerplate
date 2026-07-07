import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeTableCard } from './SedeTableCard';

const meta: Meta<typeof SedeTableCard> = {
  title: 'Sede/SedeTableCard',
  component: SedeTableCard,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeTableCard>;

export const Default: Story = {};
