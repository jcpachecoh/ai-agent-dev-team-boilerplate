import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeStatusSegment } from './SedeStatusSegment';

const meta: Meta<typeof SedeStatusSegment> = {
  title: 'Sede/SedeStatusSegment',
  component: SedeStatusSegment,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeStatusSegment>;

export const Activa: Story = { args: { value: 'active' } };
export const Inactiva: Story = { args: { value: 'inactive' } };
